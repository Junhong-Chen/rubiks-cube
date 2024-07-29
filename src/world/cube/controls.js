import { Vector2, Vector3, Matrix4, Mesh, Object3D, Raycaster, MeshBasicMaterial, PlaneGeometry, BoxGeometry, DoubleSide, Quaternion, ArrowHelper, AxesHelper } from "three"
import { Tween, Easing } from "../../utils/tween.js"
import Draggable from "../../utils/draggable.js"

const STATE = {
  STILL: 0,
  PREPARING: 1,
  ROTATING: 2,
  ANIMATING: 3,
}

const RotateType = {
  LAYER: 'layer',
  CUBE: 'cube'
}

class ControlsPlane extends Mesh {
  constructor(size = 1024) {
    super(
      new PlaneGeometry(size, size, 2, 2),
      new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: false, opacity: 0.1, toneMapped: false })
    )
    this.type = 'ControlsPlane'
  }

}

class ControlsCube extends Object3D {
  constructor(size = 1) {
    super()

    const planeGeometry = new PlaneGeometry(size, size)
    const planeMaterial = new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: false, opacity: 0.1, toneMapped: false })
    this.name = 'ControlsCube'

    const planes = []
    for (let i = 0; i < 6; i++) {
      const plane = new Mesh(planeGeometry, planeMaterial)
      planes.push(plane)
      this.add(plane)
    }

    // plane 的旋转方向，决定了 dragDelta 的正负值，并影响 layer 的旋转方向
    // 前 (z+)
    planes[0].position.set(0, 0, size / 2)
    planes[0].rotation.set(Math.PI, 0, 0)
    planes[0].userData.normal = new Vector3(0, 0, 1)

    // 后 (z-)
    planes[1].position.set(0, 0, -size / 2)
    planes[1].rotation.set(0, Math.PI, 0)
    planes[1].userData.normal = new Vector3(0, 0, -1)

    // 左 (x-)
    planes[2].position.set(-size / 2, 0, 0)
    planes[2].rotation.set(Math.PI, Math.PI / 2, 0)
    planes[2].userData.normal = new Vector3(-1, 0, 0)

    // 右 (x+)
    planes[3].position.set(size / 2, 0, 0)
    planes[3].rotation.set(0, Math.PI / 2, 0)
    planes[3].userData.normal = new Vector3(1, 0, 0)

    // 上 (y+)
    planes[4].position.set(0, size / 2, 0)
    planes[4].rotation.set(-Math.PI / 2, 0, Math.PI)
    planes[4].userData.normal = new Vector3(0, 1, 0)

    // 下 (y-)
    planes[5].position.set(0, -size / 2, 0)
    planes[5].rotation.set(-Math.PI / 2, 0, 0)
    planes[5].userData.normal = new Vector3(0, -1, 0)
  }
}

const _tempQuaternion = new Quaternion()

const _axes = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1)
}

export default class Controls {
  static TYPE = {
    FREE: 'free',
    FIXED: 'fixed'
  }

  constructor(world) {
    this.world = world

    // this.axes = new AxesHelper()
    // world.scene.add(this.axes)

    this.flipConfig = 0

    this.flipEasings = [Easing.Power.Out(3), Easing.Sine.Out(), Easing.Back.Out(1.5)]
    this.flipSpeeds = [125, 200, 300]

    this.flipAxis = null

    this.raycaster = new Raycaster()

    this.group = new Object3D() // 旋转时存放 layer 中的 piece
    this.group.name = 'templateLayer'
    this.world.cube.object.add(this.group)

    this.planeHelper = new ControlsPlane()

    this.planeHelper.rotation.set(0, Math.PI / 4, 0)
    this.world.scene.add(this.planeHelper)

    this.cubeHelper = new ControlsCube()
    this.world.scene.add(this.cubeHelper)

    this.onSolved = () => { }
    this.onMove = () => { }

    this.momentum = []

    this.scramble = null
    this.state = STATE.STILL
    this.enabled = false

    // FREE 旋转类型参数
    this.acceleration = new Vector3() // 加速度
    this.spped = 0.2 // 速度
    this.damping = 0.15 // 阻尼

    this.update = this.updateRotate.bind(this)
    this.setType(Controls.TYPE.FREE)

    this.initDraggable()

  }

  enable() {
    this.draggable.enable()
    this.enabled = true
  }

  disable() {
    this.draggable.disable()
    this.enabled = false
  }

  setType(type) {
    this.type = type
    if (this.type === Controls.TYPE.FREE) {
      this.world.addUpdateFn(this.update)
    } else {
      this.world.removeUpdateFn(this.update)
    }
  }

  initDraggable() {
    this.draggable = new Draggable(document.body)

    // 开始
    this.draggable.onDragStart = position => {
      if (this.scramble !== null) return
      if (this.state === STATE.PREPARING || this.state === STATE.ROTATING) return

      this.gettingDrag = this.state === STATE.ANIMATING

      const boxIntersect = this.getIntersect(position.current, this.cubeHelper, false)

      if (boxIntersect) {
        this.dragIntersect = this.getIntersect(position.current, this.world.cube.cubes, true)
      }

      if (boxIntersect && this.dragIntersect) {
        this.flipType = RotateType.LAYER

        const object = boxIntersect.object
        this.dragNormal = object.userData.normal.clone()

        this.planeHelper.position.copy(object.getWorldPosition(new Vector3()))
        this.planeHelper.quaternion.copy(object.getWorldQuaternion(new Quaternion()))
        this.planeHelper.updateMatrixWorld()
      } else { // 点击空白处
        this.flipType = RotateType.CUBE

        this.dragNormal = new Vector3(0, 0, 1)

        this.planeHelper.position.set(0, 0, 0)
        this.planeHelper.lookAt(this.world.camera.position.clone().normalize())
        this.planeHelper.updateMatrixWorld()
      }

      const planeIntersect = this.getIntersect(position.current, this.planeHelper, false)
      if (planeIntersect) {
        this.dragCurrent = this.planeHelper.worldToLocal(planeIntersect.point.clone())
        this.dragDistance = new Vector3()
        this.state = (this.state === STATE.STILL) ? STATE.PREPARING : this.state
      }

    }

    // 移动
    this.draggable.onDragMove = position => {
      if (this.scramble !== null) return
      if (this.state === STATE.STILL || (this.state === STATE.ANIMATING && this.gettingDrag === false)) return

      const planeIntersect = this.getIntersect(position.current, this.planeHelper, false)
      if (!planeIntersect) return

      const point = this.planeHelper.worldToLocal(planeIntersect.point.clone())

      const dragDelta = point.clone().sub(this.dragCurrent).setZ(0)
      this.dragDistance.add(dragDelta)
      this.dragCurrent = point
      this.addMomentumPoint(dragDelta)

      if (this.state === STATE.PREPARING && this.dragDistance.length() > 0.02) {

        // 计算旋转轴
        if (this.flipType === RotateType.LAYER) {

          this.flipAxis = this.getFlipAxis(this.dragNormal, this.dragDistance.clone())
          this.dragDirection = this.getDragDirection(this.dragNormal, this.flipAxis.clone())
          const layer = this.getLayer()
          this.selectLayer(layer) // 将选中的 pices 从 cube 移动到 group 中，方便对 layer 旋转
        } else {
          this.dragDirection = this.getMaxAxis(this.dragDistance)

          const axis = (this.dragDirection === 'x')
            ? 'y'
            : position.current.x > 0 ? 'z' : 'x'

          this.flipAxis = new Vector3()
          this.flipAxis[axis] = axis === 'x' ? - 1 : 1
        }

        this.flipAngle = 0
        this.state = STATE.ROTATING
      } else if (this.state === STATE.ROTATING) {
        const rotation = dragDelta[this.dragDirection]

        if (this.flipType === RotateType.LAYER) {
          this.group.rotateOnAxis(this.flipAxis, rotation)
          this.flipAngle += rotation
        } else {
          if (this.type === Controls.TYPE.FREE) {
            this.acceleration.x -= dragDelta.x
            this.acceleration.y -= dragDelta.y
          } else {
            this.cubeHelper.rotateOnWorldAxis(this.flipAxis, rotation)
            this.world.cube.object.rotation.copy(this.cubeHelper.rotation)
            this.flipAngle += rotation
          }
        }
      }
    }

    // 结束
    this.draggable.onDragEnd = position => {
      if (this.scramble !== null) return
      if (this.state !== STATE.ROTATING) {
        this.gettingDrag = false
        this.state = STATE.STILL
        return
      }

      this.state = STATE.ANIMATING

      const momentum = this.getMomentum()[this.dragDirection]
      const flip = (Math.abs(momentum) > 0.05 && Math.abs(this.flipAngle) < Math.PI / 2)

      const angle = flip
        ? this.roundAngle(this.flipAngle + Math.sign(this.flipAngle) * (Math.PI / 4))
        : this.roundAngle(this.flipAngle)

      const delta = angle - this.flipAngle

      if (this.flipType === RotateType.LAYER) {
        this.rotateLayer(delta, false, layer => {

          this.world.storage.saveGame()

          this.state = this.gettingDrag ? STATE.PREPARING : STATE.STILL
          this.gettingDrag = false

          this.checkIsSolved()
        })
      } else {
        this.state = this.gettingDrag ? STATE.PREPARING : STATE.STILL

        this.rotateCube(delta, () => {
          this.state = this.gettingDrag ? STATE.PREPARING : STATE.STILL
          this.gettingDrag = false
        })
      }
    }
  }

  getFlipAxis(faceNormal, direction) {
    const worldDirection = this.planeHelper.localToWorld(direction).sub(this.planeHelper.position).normalize() // 将在 planeHelper 上的拖动方向转到世界坐标系中
    const cubeDirection = this.cubeHelper.worldToLocal(worldDirection) // 再将拖动方向转到 cubeHelper 上

    const axis = this.getMaxAxis(cubeDirection)
    const calcDirection = new Vector3()
    calcDirection[axis] = cubeDirection[axis] // 保留偏移最大的轴
    // calcDirection.round()
    calcDirection.cross(faceNormal) // 拖动的方向向量与拖动面的法线叉乘，得到旋转轴

    const flipMaxAxis = this.getMaxAxis(calcDirection)
    calcDirection[flipMaxAxis] = 1
    // const axis2World = this.cubeHelper.localToWorld(_axes[flipMaxAxis].clone())

    // if (Math.sign(calcDirection[flipMaxAxis]) !== Math.sign(axis2World[flipMaxAxis]))
    //   calcDirection[flipMaxAxis] = -calcDirection[flipMaxAxis]

    return calcDirection
  }

  getDragDirection(faceNormal, flipAxis) {
    const calcDirection = flipAxis.cross(faceNormal)
    const worldDirection = this.cubeHelper.localToWorld(calcDirection)
    const planeDirection = this.planeHelper.worldToLocal(worldDirection)

    return this.getMaxAxis(planeDirection)
  }

  rotateLayer(rotation, scramble, callback) {
    const config = scramble ? 0 : this.flipConfig

    const easing = this.flipEasings[config]
    const duration = this.flipSpeeds[config]
    const bounce = (config == 2) ? this.bounceCube() : (() => { })

    new Tween({
      easing,
      duration,
      onUpdate: tween => {
        let deltaAngle = tween.delta * rotation
        this.group.rotateOnAxis(this.flipAxis, deltaAngle)
        bounce(tween.value, deltaAngle, rotation)
      },
      onComplete: () => {
        if (!scramble) this.onMove()

        const layer = this.flipLayer.slice(0)

        // this.world.cube.object.rotation.fromArray(this.snapRotation(this.world.cube.object.rotation.toArray())) // 矫正 cube 转向
        this.group.rotation.fromArray(this.snapRotation(this.group.rotation.toArray()))
        this.deselectLayer(this.flipLayer)

        callback(layer)
      },
    })
  }

  bounceCube() {
    let fixDelta = true

    return (progress, delta, rotation) => {

      if (progress >= 1) {
        if (fixDelta) {
          delta = (progress - 1) * rotation
          fixDelta = false
        }

        this.world.cube.object.rotateOnAxis(this.flipAxis, delta)
      }
    }
  }

  rotateCube(rotation, callback) {
    if (this.type === Controls.TYPE.FREE) {
    } else if (this.type === Controls.TYPE.FIXED) {
      const config = this.flipConfig
      const easing = [Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2)][config]
      const duration = [100, 150, 350][config]

      new Tween({
        easing: easing,
        duration: duration,
        onUpdate: tween => {
          this.cubeHelper.rotateOnWorldAxis(this.flipAxis, tween.delta * rotation)
          this.world.cube.object.rotation.copy(this.cubeHelper.rotation)
        },
        onComplete: () => {
          this.cubeHelper.rotation.fromArray(this.snapRotation(this.cubeHelper.rotation.toArray()))
          this.world.cube.object.rotation.copy(this.cubeHelper.rotation)
          callback()
        },
      })
    }
  }

  selectLayer(layer) {
    this.group.rotation.set(0, 0, 0)
    this.movePieces(layer, this.world.cube.object, this.group)
    this.flipLayer = layer
  }

  deselectLayer(layer) {
    this.movePieces(layer, this.group, this.world.cube.object)
    this.flipLayer = null
  }

  movePieces(layer, from, to) {
    from.updateMatrixWorld()
    to.updateMatrixWorld()

    layer.forEach(index => {
      const piece = this.world.cube.pieces[index]

      piece.applyMatrix4(from.matrixWorld)
      from.remove(piece)
      piece.applyMatrix4(new Matrix4().copy(to.matrixWorld).invert())
      to.add(piece)
    })
  }

  getLayer(position) {
    const scalar = { 2: 6, 3: 3, 4: 4, 5: 3 }[this.world.cube.size]
    const layer = []

    let axis

    if (position) {
      axis = this.getMaxAxis(position)
    } else {
      const piece = this.dragIntersect.object.parent

      axis = this.getMaxAxis(this.flipAxis)
      position = piece.position.clone().multiplyScalar(scalar).round()
    }

    this.world.cube.pieces.forEach(piece => {
      const piecePosition = piece.position.clone().multiplyScalar(scalar).round()

      // 在旋转轴上，距离相同的 piece，这些 piece 组合起来就是需要旋转的 layer。比如绕 x 轴旋转，被拖动的小块在 x 轴上是 -1，那么所有 x 为 -1 的小块组合起来就是需要旋转的 layer
      if (piecePosition[axis] === position[axis]) layer.push(piece.name)
    })

    return layer
  }

  scrambleCube() {
    if (this.scramble === null) {
      this.scramble = this.world.scrambler
      this.scramble.callback = (typeof callback !== 'function') ? () => { } : callback
    }

    const converted = this.scramble.converted
    const move = converted.shift()
    const layer = this.getLayer(move.position)

    this.flipAxis = new Vector3()
    this.flipAxis[move.axis] = 1

    this.selectLayer(layer)
    this.rotateLayer(move.angle, true, () => {

      if (converted.length > 0) {
        this.scrambleCube()
      } else {
        this.scramble = null
        this.world.storage.saveGame()
      }
    })
  }

  getIntersect(position, object, multiple) {
    this.raycaster.setFromCamera(
      position.clone(),
      this.world.camera
    )

    const intersect = (multiple)
      ? this.raycaster.intersectObjects(object)
      : this.raycaster.intersectObject(object)

    return (intersect.length > 0) ? intersect[0] : false
  }

  getMaxAxis(vector) {
    return Object.keys(vector).reduce(
      (a, b) => Math.abs(vector[a]) > Math.abs(vector[b]) ? a : b
    )
  }

  addMomentumPoint(delta) {
    const time = Date.now()
    const stayTime = 200

    this.momentum = this.momentum.filter(moment => time - moment.time < stayTime)

    if (delta !== false) this.momentum.push({ delta, time })
  }

  getMomentum() {
    const points = this.momentum.length
    const momentum = new Vector2()

    this.addMomentumPoint(false)

    this.momentum.forEach((point, index) => {
      momentum.add(point.delta.multiplyScalar(index / points))
    })

    return momentum
  }

  // 将角度圆整到最接近的 90° 的倍数
  roundAngle(angle) {
    const round = Math.PI / 2
    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round
  }

  snapRotation(rotationArray) {
    return rotationArray.map(value => Number.isFinite(value) ? this.roundAngle(value) : value)
  }

  // 检查魔方是否还原
  checkIsSolved() {
    const start = performance.now()

    let solved = true
    const sides = { 'x-': [], 'x+': [], 'y-': [], 'y+': [], 'z-': [], 'z+': [] }

    const positions = []

    this.world.cube.edges.forEach(edge => {
      const position = edge.parent
        .localToWorld(edge.position.clone())
        .sub(this.world.cube.object.position)

      const mainAxis = this.getMaxAxis(position)
      const mainSign = position.multiplyScalar(2).round()[mainAxis] < 1 ? '-' : '+'

      sides[mainAxis + mainSign].push(edge.name)
    })

    Object.keys(sides).forEach(side => {
      if (!sides[side].every(value => value === sides[side][0])) solved = false
    })

    if (solved) this.onSolved()
  }

  updateRotate() {
    if (Math.abs(this.acceleration.x) > 1e-6 || Math.abs(this.acceleration.y) > 1e-6) {
      const eye = new Vector3(1, 0, 1).normalize()
      const rotationAxis = new Vector3().copy(this.acceleration).cross(eye).normalize()
      const rotationAngle = this.acceleration.length() * this.spped

      _tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle)
      this.cubeHelper.applyQuaternion(_tempQuaternion)

      this.world.cube.object.quaternion.copy(this.cubeHelper.quaternion)
      // this.axes.quaternion.copy(this.cubeHelper.quaternion)

      this.acceleration.x *= (1 - this.damping)
      this.acceleration.y *= (1 - this.damping)
    }
  }
}