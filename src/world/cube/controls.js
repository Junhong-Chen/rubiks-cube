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
  constructor() {
    super(
      new PlaneGeometry(1024, 1024, 2, 2),
      new MeshBasicMaterial({ visible: true, wireframe: true, side: DoubleSide, transparent: false, opacity: 0.1, toneMapped: false })
    )
    this.type = 'ControlsPlane'
  }

}

class ControlsCube extends Mesh {
  constructor() {
    super(
      new BoxGeometry(1, 1, 1),
      new MeshBasicMaterial({ visible: true, wireframe: true, side: DoubleSide, transparent: false, opacity: 0.1, toneMapped: false })
    )
    this.type = 'ControlsCube'
  }
}

const _tempQuaternion = new Quaternion()
const _quaternionStart = new Quaternion()

export default class Controls {
  static TYPE = {
    FREE: 'free',
    FIXED: 'fixed'
  }

  constructor(world) {
    // this.axisHelper = AxisHelper()
    // world.scene.add(this.axisHelper)

    // test
    this.axes = new AxesHelper()
    world.scene.add(this.axes)

    this.world = world

    this.flipConfig = 0

    this.flipEasings = [Easing.Power.Out(3), Easing.Sine.Out(), Easing.Back.Out(1.5)]
    this.flipSpeeds = [125, 200, 300]

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

    // FREE 类型旋转参数
    this.acceleration = new Vector3() // 加速度
    this.spped = 0.2 // 速度
    this.damping = 0.15 // 阻尼

    this.update = this.update.bind(this)
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

      if (boxIntersect !== false) {
        this.dragIntersect = this.getIntersect(position.current, this.world.cube.cubes, true)
      }

      if (boxIntersect !== false && this.dragIntersect !== false) {
        this.flipType = RotateType.LAYER
        this.dragNormal = boxIntersect.face.normal.round()
        const worldDragNormal = this.dragNormal.clone().applyMatrix4(this.cubeHelper.matrixWorld)

        this.planeHelper.lookAt(worldDragNormal)
        this.planeHelper.updateMatrixWorld()
      } else { // 点击空白处
        this.flipType = RotateType.CUBE

        _quaternionStart.copy(this.cubeHelper.quaternion)

        this.dragNormal = new Vector3(0, 0, 1)

        this.planeHelper.lookAt(new Vector3().copy(this.world.camera.position).normalize())
        this.planeHelper.updateMatrixWorld()
      }

      let planeIntersect = this.getIntersect(position.current, this.planeHelper, false)
      if (planeIntersect === false) return

      this.dragCurrent = this.planeHelper.worldToLocal(planeIntersect.point)
      this.dragDistance = new Vector3()
      this.state = (this.state === STATE.STILL) ? STATE.PREPARING : this.state
    }

    // 移动
    this.draggable.onDragMove = position => {
      if (this.scramble !== null) return
      if (this.state === STATE.STILL || (this.state === STATE.ANIMATING && this.gettingDrag === false)) return

      const planeIntersect = this.getIntersect(position.current, this.planeHelper, false)
      if (planeIntersect === false) return

      const point = this.planeHelper.worldToLocal(planeIntersect.point.clone())

      const dragDelta = point.clone().sub(this.dragCurrent).setZ(0)
      this.dragDistance.add(dragDelta)
      this.dragCurrent = point
      this.addMomentumPoint(dragDelta)

      if (this.state === STATE.PREPARING && this.dragDistance.length() > 0.02) {
        this.dragDirection = this.getMainAxis(this.dragDistance)

        // 计算旋转轴
        if (this.flipType === RotateType.LAYER) {
          const direction = new Vector3()
          direction[this.dragDirection] = 1

          const worldDirection = this.planeHelper.localToWorld(direction).sub(this.planeHelper.position)
          const objectDirection = this.cubeHelper.worldToLocal(worldDirection)
          const _axis = this.getMainAxis(objectDirection)
          const calcDirection = new Vector3()
          calcDirection[_axis] = objectDirection[_axis]
          calcDirection.round()

          this.flipAxis = calcDirection.cross(this.dragNormal).negate()

          const layer = this.getLayer()
          this.selectLayer(layer) // 将 layer 中选择的 pices 从 cube 移动到 group 中，方便对 layer 旋转
        } else {
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

  // retainMax(vector) {
  //   const components = ['x', 'y', 'z']
  //   const max = components.reduce((max, comp) => 
  //     Math.abs(vector[comp]) > Math.abs(vector[max]) ? comp : max, components[0])

  //   const result = new Vector3()
  //   result[max] = vector[max]

  //   return result.round()
  // }

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
      axis = this.getMainAxis(position)
    } else {
      const piece = this.dragIntersect.object.parent

      axis = this.getMainAxis(this.flipAxis)
      position = piece.position.clone().multiplyScalar(scalar).round()
    }

    this.world.cube.pieces.forEach(piece => {
      const piecePosition = piece.position.clone().multiplyScalar(scalar).round()

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

  getMainAxis(vector) {
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

      const mainAxis = this.getMainAxis(position)
      const mainSign = position.multiplyScalar(2).round()[mainAxis] < 1 ? '-' : '+'

      sides[mainAxis + mainSign].push(edge.name)
    })

    Object.keys(sides).forEach(side => {
      if (!sides[side].every(value => value === sides[side][0])) solved = false
    })

    if (solved) this.onSolved()
  }

  update() {
    if (Math.abs(this.acceleration.x) > 1e-6 || Math.abs(this.acceleration.y) > 1e-6) {
      const eye = new Vector3(1, 0, 1).normalize()
      const rotationAxis = new Vector3().copy(this.acceleration).cross(eye).normalize()
      const rotationAngle = this.acceleration.length() * this.spped

      // this.axisHelper.setDirection(rotationAxis)

      _tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle)
      this.cubeHelper.applyQuaternion(_tempQuaternion)

      this.world.cube.object.quaternion.copy(this.cubeHelper.quaternion)

      this.axes.quaternion.copy(this.cubeHelper.quaternion)

      this.acceleration.x *= (1 - this.damping)
      this.acceleration.y *= (1 - this.damping)
    }
  }
}