import {
  DoubleSide,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  Vector3
} from 'three'

const _raycaster = new Raycaster()
const _tempVector = new Vector3()
const _tempQuaternion = new Quaternion()

const _changeEvent = { type: 'change' }
const _mouseDownEvent = { type: 'mouseDown' }
const _mouseUpEvent = { type: 'mouseUp' }
const _objectChangeEvent = { type: 'objectChange' }

class TransformControls extends Object3D {
  constructor(camera, domElement) {
    super()

    if (domElement === undefined) {
      console.warn('THREE.TransformControls: The second parameter "domElement" is now mandatory.')
      domElement = document
    }

    this.isTransformControls = true
    this.visible = false
    this.domElement = domElement
    this.domElement.style.touchAction = 'none'

    const _plane = new TransformControlsPlane()
    this._plane = _plane
    this.add(_plane)

    const scope = this

    function defineProperty(propName, defaultValue) {
      let propValue = defaultValue

      Object.defineProperty(scope, propName, {
        get: function () {
          return propValue !== undefined ? propValue : defaultValue
        },
        set: function (value) {
          if (propValue !== value) {
            propValue = value
            _plane[propName] = value
            scope.dispatchEvent({ type: propName + '-changed', value: value })
            scope.dispatchEvent(_changeEvent)
          }
        }
      })

      scope[propName] = defaultValue
      _plane[propName] = defaultValue
    }

    defineProperty('camera', camera)
    defineProperty('object', undefined)
    defineProperty('enabled', true)
    defineProperty('dragging', false)
    defineProperty('rotationSpeed', 0.5)
    defineProperty('dampingFactor', 0.1)

    const worldPosition = new Vector3()
    const worldPositionStart = new Vector3()
    const worldQuaternion = new Quaternion()
    const worldQuaternionStart = new Quaternion()
    const cameraPosition = new Vector3()
    const cameraQuaternion = new Quaternion()
    const pointStart = new Vector3()
    const pointEnd = new Vector3()
    const rotationAxis = new Vector3()
    let rotationAngle = 0
    const eye = new Vector3()

    defineProperty('worldPosition', worldPosition)
    defineProperty('worldPositionStart', worldPositionStart)
    defineProperty('worldQuaternion', worldQuaternion)
    defineProperty('worldQuaternionStart', worldQuaternionStart)
    defineProperty('cameraPosition', cameraPosition)
    defineProperty('cameraQuaternion', cameraQuaternion)
    defineProperty('pointStart', pointStart)
    defineProperty('pointEnd', pointEnd)
    defineProperty('rotationAxis', rotationAxis)
    defineProperty('rotationAngle', rotationAngle)
    defineProperty('eye', eye)

    this._offset = new Vector3()
    this._startNorm = new Vector3()
    this._endNorm = new Vector3()
    this._cameraScale = new Vector3()
    this._parentPosition = new Vector3()
    this._parentQuaternion = new Quaternion()
    this._parentQuaternionInv = new Quaternion()
    this._parentScale = new Vector3()
    this._worldScaleStart = new Vector3()
    this._worldQuaternionInv = new Quaternion()
    this._worldScale = new Vector3()
    this._positionStart = new Vector3()
    this._quaternionStart = new Quaternion()
    this._scaleStart = new Vector3()

    this._getPointer = getPointer.bind(this)
    this._onPointerDown = onPointerDown.bind(this)
    this._onPointerMove = onPointerMove.bind(this)
    this._onPointerUp = onPointerUp.bind(this)

    this.domElement.addEventListener('pointerdown', this._onPointerDown)
    this.domElement.addEventListener('pointerup', this._onPointerUp)
  }

  updateMatrixWorld(force) {
    if (this.object !== undefined) {
      this.object.updateMatrixWorld()

      if (this.object.parent === null) {
        console.error('TransformControls: The attached 3D object must be a part of the scene graph.')
      } else {
        this.object.parent.matrixWorld.decompose(this._parentPosition, this._parentQuaternion, this._parentScale)
      }

      this.object.matrixWorld.decompose(this.worldPosition, this.worldQuaternion, this._worldScale)
      this._parentQuaternionInv.copy(this._parentQuaternion).invert()
      this._worldQuaternionInv.copy(this.worldQuaternion).invert()
    }

    this.camera.updateMatrixWorld()
    this.camera.matrixWorld.decompose(this.cameraPosition, this.cameraQuaternion, this._cameraScale)

    if (this.camera.isOrthographicCamera) {
      this.camera.getWorldDirection(this.eye).negate()
    } else {
      this.eye.copy(this.cameraPosition).sub(this.worldPosition).normalize()
    }

    super.updateMatrixWorld(force)
  }

  pointerDown(pointer) {
    if (this.object === undefined || this.dragging === true || (pointer != null && pointer.button !== 0)) return

    if (pointer !== null) _raycaster.setFromCamera(pointer, this.camera)

    const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true)

    if (planeIntersect) {
      this.object.updateMatrixWorld()
      this.object.parent.updateMatrixWorld()

      this._positionStart.copy(this.object.position)
      this._quaternionStart.copy(this.object.quaternion)
      this._scaleStart.copy(this.object.scale)

      this.object.matrixWorld.decompose(this.worldPositionStart, this.worldQuaternionStart, this._worldScaleStart)

      this.pointStart.copy(planeIntersect.point).sub(this.worldPositionStart)
    }

    this.dragging = true
    this.dispatchEvent(_mouseDownEvent)
  }

  pointerMove(pointer) {
    const object = this.object

    if (object === undefined || this.dragging === false || (pointer !== null && pointer.button !== -1)) return

    if (pointer !== null) _raycaster.setFromCamera(pointer, this.camera)

    const planeIntersect = intersectObjectWithRay(this._plane, _raycaster, true)

    if (!planeIntersect) return

    this.pointEnd.copy(planeIntersect.point).sub(this.worldPositionStart)

    this._offset.copy(this.pointEnd).sub(this.pointStart)

    const ROTATION_SPEED = 20 / this.worldPosition.distanceTo(_tempVector.setFromMatrixPosition(this.camera.matrixWorld)) * this.rotationSpeed

    this.rotationAxis.copy(this._offset).cross(this.eye).normalize()
    this.rotationAngle = this._offset.dot(_tempVector.copy(this.rotationAxis).cross(this.eye)) * ROTATION_SPEED

    this.rotationAxis.applyQuaternion(this._parentQuaternionInv)
    object.quaternion.copy(_tempQuaternion.setFromAxisAngle(this.rotationAxis, this.rotationAngle))
    object.quaternion.multiply(this._quaternionStart).normalize()

    // Apply damping
    // object.quaternion.slerp(this._quaternionStart, this.dampingFactor)

    this.dispatchEvent(_changeEvent)
    this.dispatchEvent(_objectChangeEvent)
  }

  pointerUp(pointer) {
    if (pointer !== null && pointer.button !== 0) return

    if (this.dragging) {
      this.dispatchEvent(_mouseUpEvent)
    }

    this.dragging = false
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown)
    this.domElement.removeEventListener('pointermove', this._onPointerMove)
    this.domElement.removeEventListener('pointerup', this._onPointerUp)

    this.traverse(function (child) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    })
  }

  attach(object) {
    this.object = object
    this.visible = true

    return this
  }

  detach() {
    this.object = undefined
    this.visible = false

    return this
  }

  reset() {
    if (!this.enabled) return

    if (this.dragging) {
      this.object.position.copy(this._positionStart)
      this.object.quaternion.copy(this._quaternionStart)
      this.object.scale.copy(this._scaleStart)

      this.dispatchEvent(_changeEvent)
      this.dispatchEvent(_objectChangeEvent)

      this.pointStart.copy(this.pointEnd)
    }
  }

  getRaycaster() {
    return _raycaster
  }
}

// Mouse / touch event handlers

function getPointer(event) {
  if (this.domElement.ownerDocument.pointerLockElement) {
    return {
      x: 0,
      y: 0,
      button: event.button
    }
  } else {
    const rect = this.domElement.getBoundingClientRect()

    return {
      x: (event.clientX - rect.left) / rect.width * 2 - 1,
      y: - (event.clientY - rect.top) / rect.height * 2 + 1,
      button: event.button
    }
  }
}

function onPointerDown(event) {
  if (!this.enabled) return

  if (!document.pointerLockElement) {
    this.domElement.setPointerCapture(event.pointerId)
  }

  this.domElement.addEventListener('pointermove', this._onPointerMove)

  this.pointerDown(this._getPointer(event))
}

function onPointerMove(event) {
  if (!this.enabled) return

  this.pointerMove(this._getPointer(event))
}

function onPointerUp(event) {
  if (!this.enabled) return

  this.domElement.releasePointerCapture(event.pointerId)

  this.domElement.removeEventListener('pointermove', this._onPointerMove)

  this.pointerUp(this._getPointer(event))
}

function intersectObjectWithRay(object, raycaster, includeInvisible) {
  const allIntersections = raycaster.intersectObject(object, true)

  for (let i = 0; i < allIntersections.length; i++) {
    if (allIntersections[i].object.visible || includeInvisible) {
      return allIntersections[i]
    }
  }

  return false
}

// Reusable utility variables

const _alignVector = new Vector3(0, 1, 0)
const _dirVector = new Vector3()
const _tempMatrix = new Matrix4()

// Helper plane
class TransformControlsPlane extends Mesh {
  constructor() {
    super(
      new PlaneGeometry(100000, 100000, 2, 2),
      new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: false, opacity: 0.1, toneMapped: false })
    )

    this.isTransformControlsPlane = true
    this.type = 'TransformControlsPlane'
  }

  updateMatrixWorld(force) {
    this.position.copy(this.worldPosition)

    _dirVector.set(0, 0, 0)

    if (_dirVector.length() === 0) {
      this.quaternion.copy(this.cameraQuaternion)
    } else {
      _tempMatrix.lookAt(_tempVector.set(0, 0, 0), _dirVector, _alignVector)
      this.quaternion.setFromRotationMatrix(_tempMatrix)
    }

    super.updateMatrixWorld(force)
  }
}

export { TransformControls, TransformControlsPlane }
