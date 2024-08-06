import { Vector2, Vector3, Matrix4, Mesh, Object3D, Raycaster, MeshBasicMaterial, PlaneGeometry, DoubleSide, Quaternion, ArrowHelper, AxesHelper, ShaderMaterial, } from "three"
import { Tween, Easing } from "../../utils/tween.js"
import Draggable from "../../utils/draggable.js"
import { STATE_TYPE } from "../../utils/store.js"

const STATE = {
  STILL: 0,
  PREPARING: 1,
  ROTATING: 2,
  ANIMATING: 3,
}

const ROTATE_TARGET = {
  LAYER: 'layer',
  CUBE: 'cube'
}

const ROTATION_TYPE = {
  FREE: 0,
  FIXED: 1
}

const FLIP_TYPE = {
  SWIFT: 0,
  SMOOTH: 1,
  BOUNCE: 2
}

const material = new MeshBasicMaterial({ visible: false, wireframe: true, side: DoubleSide, transparent: true, depthWrite: false, opacity: 0.5, toneMapped: false })

class ControlsPlane extends Mesh {
  constructor(size = 1024) {
    super(
      new PlaneGeometry(size, size, 2, 2),
      material.clone()
    )
    this.type = 'ControlsPlane'
  }

}

class ControlsCube extends Object3D {
  constructor(size = 1) {
    super()

    const planeGeometry = new PlaneGeometry(size, size)
    this.name = 'ControlsCube'

    const planes = []
    for (let i = 0; i < 6; i++) {
      const plane = new Mesh(planeGeometry, material)
      planes.push(plane)
      this.add(plane)
    }

    // plane 的旋转方向，决定了 dragDelta 的正负值，并影响 layer 的旋转方向
    // 前 (z+)
    planes[0].position.set(0, 0, size / 2)
    planes[0].rotation.set(0, 0, -Math.PI / 2)
    planes[0].userData.normal = new Vector3(0, 0, 1)

    // 后 (z-)
    planes[1].position.set(0, 0, -size / 2)
    planes[1].rotation.set(0, Math.PI, 0)
    planes[1].userData.normal = new Vector3(0, 0, -1)

    // 左 (x-)
    planes[2].position.set(-size / 2, 0, 0)
    planes[2].rotation.set(Math.PI / 2, -Math.PI / 2, 0)
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
    planes[5].rotation.set(Math.PI / 2, 0, -Math.PI / 2)
    planes[5].userData.normal = new Vector3(0, -1, 0)
  }
}

const _tempVector = new Vector3()
const _tempQuaternion = new Quaternion()

export default class Controls {

  constructor(world) {
    this.world = world

    // this.axes = new AxesHelper()
    // world.scene.add(this.axes)

    // this.arrow = new ArrowHelper()
    // world.scene.add(this.arrow)

    this.flipType

    this.flipEasings = [Easing.Power.Out(3), Easing.Sine.Out(), Easing.Back.Out(1.5)]
    this.flipSpeeds = [125, 200, 300]

    this.flipAxis = new Vector3()

    this.raycaster = new Raycaster()

    this.group = new Object3D() // 旋转时存放 layer 中的 piece
    this.group.name = 'templateLayer'
    this.world.cube.object.add(this.group)

    // 捕获旋转轴
    this.planeHelper = new ControlsPlane()
    this.world.scene.add(this.planeHelper)

    // 捕获偏移量
    this.offsetHelper = new ControlsPlane()
    this.offsetHelper.lookAt(this.world.camera.position)
    this.world.scene.add(this.offsetHelper)

    this.cubeHelper = new ControlsCube()
    this.world.scene.add(this.cubeHelper)


    this.momentum = []

    this.scramble = null
    this.enabled = false

    // FREE 旋转类型参数
    this.type
    this.acceleration = new Vector3() // 加速度
    this.rotationSpeed = 0.2 // 速度
    this.damping = 0.15 // 阻尼

    this.cameraDir = this.world.camera.position.clone().normalize()

    this.update = this.rotateCubeFree.bind(this)

    this.onSolved = () => { }
    this.onLayerMove = () => { }

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

  setRotationType(type) {
    if (this.type !== type) {
      this.type = type
      if (type === ROTATION_TYPE.FREE) {
        this.world.addUpdateFn(this.update)
      } else {
        this.world.removeUpdateFn(this.update)
        this.world.cube.reset()
      }
    }
  }

  setFlipType(type) {
    if (this.flipType !== type) {
      this.flipType = type
    }
  }

  initDraggable() {
    this.draggable = new Draggable(this.world.dom.ui, { allowTouchmoveElement: this.world.dom.prefs })
    let state = STATE.STILL, dragDistance = new Vector3()
    let gettingDrag, flipType, dragNormal, dragIntersect, flipAngle, planeCurrent, offsetCurrent, dragDirection

    // 开始
    this.draggable.onDragStart = position => {
      if (this.scramble !== null || state === STATE.PREPARING || state === STATE.ROTATING) return

      gettingDrag = state === STATE.ANIMATING

      const boxIntersect = this.getIntersect(position.current, this.cubeHelper, false)
      if (boxIntersect) {
        dragIntersect = this.getIntersect(position.current, this.world.cube.cubes, true)
      }

      if (boxIntersect && dragIntersect) {
        prepareLayerRotation(boxIntersect)
      } else {
        prepareCubeRotation()
      }

      const planeIntersect = this.getIntersect(position.current, this.planeHelper, false)
      if (planeIntersect) {
        state = (state === STATE.STILL) ? STATE.PREPARING : state
        planeCurrent = this.planeHelper.worldToLocal(planeIntersect.point.clone())
        dragDistance.set(0, 0, 0)

        const offsetIntersect = this.getIntersect(position.current, this.offsetHelper, false)
        offsetCurrent = this.offsetHelper.worldToLocal(offsetIntersect.point.clone())
      }
    }

    // 拖动
    this.draggable.onDragMove = position => {
      if (this.scramble !== null || state === STATE.STILL || (state === STATE.ANIMATING && gettingDrag === false)) return

      const offsetIntersect = this.getIntersect(position.current, this.offsetHelper, false)
      const point = this.planeHelper.worldToLocal(offsetIntersect.point.clone())
      const dragDelta = point.clone().sub(offsetCurrent).setZ(0)
      offsetCurrent = point

      this.addMomentumPoint(dragDelta)

      if (state === STATE.PREPARING) {
        handlePreparingState(position)
      } else if (state === STATE.ROTATING) {
        handleRotatingState(dragDelta)
      }
    }

    // 结束
    this.draggable.onDragEnd = position => {
      if (this.scramble !== null) return
      if (state !== STATE.ROTATING) {
        gettingDrag = false
        state = STATE.STILL
        return
      }

      state = STATE.ANIMATING
      handleDragEnd()
    }

    // 层旋转准备
    const prepareLayerRotation = boxIntersect => {
      flipType = ROTATE_TARGET.LAYER

      const object = boxIntersect.object
      dragNormal = object.userData.normal.clone()

      // 同步 planeHelper
      const objQuaternion = object.getWorldQuaternion(new Quaternion())
      this.planeHelper.quaternion.copy(objQuaternion)
      this.planeHelper.updateMatrixWorld()
    }

    // 魔方旋转准备
    const prepareCubeRotation = () => {
      flipType = ROTATE_TARGET.CUBE

      dragNormal = this.cameraDir

      this.planeHelper.lookAt(dragNormal)
      this.planeHelper.updateMatrixWorld()
    }

    // 获取用户拖动方向
    const handlePreparingState = position => {
      const planeIntersect = this.getIntersect(position.current, this.planeHelper, false)
      const point = this.planeHelper.worldToLocal(planeIntersect.point.clone())

      const dragDelta = point.clone().sub(planeCurrent).setZ(0)
      dragDistance.add(dragDelta)
      planeCurrent = point

      if (dragDistance.length() > 0.02) { // 拖动一定距离后计算
        calcAxis(position)
      }
    }

    // 计算旋转轴
    const calcAxis = position => {
      switch (flipType) {
        case ROTATE_TARGET.LAYER: {
          this.flipAxis = this.getFlipAxis(dragNormal, dragDistance.clone())
          dragDirection = this.getDragDirection(dragNormal, this.flipAxis.clone())

          const piece = dragIntersect.object.parent
          const axis = this.getMaxAxis(this.flipAxis)
          const position = piece.position.clone().multiplyScalar(this.getSalar()).round()
          const layer = this.getLayer(position, axis)

          this.selectLayer(layer)
          break
        }
        case ROTATE_TARGET.CUBE:
          dragDirection = this.getMaxAxis(dragDistance)

          const axis = dragDirection === 'x' ? 'y' : position.current.x > 0 ? 'z' : 'x'

          this.flipAxis.set(0, 0, 0)
          this.flipAxis[axis] = axis === 'x' ? -1 : 1
          break
      }

      flipAngle = 0
      state = STATE.ROTATING
    }

    // 处理旋转
    const handleRotatingState = dragDelta => {
      const rotation = dragDelta[dragDirection]

      switch (flipType) {
        case ROTATE_TARGET.LAYER:
          this.group.rotateOnAxis(this.flipAxis, rotation)
          flipAngle += rotation
          break
        case ROTATE_TARGET.CUBE:
          switch (this.type) {
            case ROTATION_TYPE.FREE:
              this.acceleration.x -= dragDelta.x
              this.acceleration.y -= dragDelta.y
              break
            case ROTATION_TYPE.FIXED:
              this.cubeHelper.rotateOnWorldAxis(this.flipAxis, rotation)
              this.world.cube.object.rotation.copy(this.cubeHelper.rotation)
              flipAngle += rotation
              break
          }
          break
      }
    }

    // 拖动结束
    const handleDragEnd = () => {
      const momentum = this.getMomentum()[dragDirection]
      const flip = (Math.abs(momentum) > 0.05 && Math.abs(flipAngle) < Math.PI / 2)

      const angle = flip ? this.roundAngle(flipAngle + Math.sign(flipAngle) * (Math.PI / 4)) : this.roundAngle(flipAngle)
      const delta = angle - flipAngle

      switch (flipType) {
        case ROTATE_TARGET.LAYER:
          this.rotateLayer(delta, angle !== 0, this.flipType, layer => {
            state = gettingDrag ? STATE.PREPARING : STATE.STILL
            gettingDrag = false

            if (angle !== 0) {
              this.world.store.setState(STATE_TYPE.GAME, {
                [this.world.cube.size]: {
                  cubeData: this.world.cube.data
                }
              })
            }

            this.checkIsSolved()
          })
          break
        case ROTATE_TARGET.CUBE:
          state = gettingDrag ? STATE.PREPARING : STATE.STILL

          if (this.type === ROTATION_TYPE.FIXED) {
            this.rotateCubeFixed(delta, () => {
              state = gettingDrag ? STATE.PREPARING : STATE.STILL
              gettingDrag = false
            })
          }
          break
      }
    }
  }

  getFlipAxis(faceNormal, direction) {
    const worldDirection = this.planeHelper.localToWorld(direction).sub(this.planeHelper.position).normalize() // 将在 planeHelper 上的拖动方向转到世界坐标系中
    const cubeDirection = this.cubeHelper.worldToLocal(worldDirection) // 再将拖动方向转到 cubeHelper 上

    const axis = this.getMaxAxis(cubeDirection)
    const calcDirection = new Vector3()
    calcDirection[axis] = cubeDirection[axis] // 保留偏移最大的轴

    calcDirection.cross(faceNormal) // 拖动的方向向量与拖动面的法线叉乘，得到旋转轴

    const flipMaxAxis = this.getMaxAxis(calcDirection)
    calcDirection[flipMaxAxis] = 1

    return calcDirection
  }

  getDragDirection(faceNormal, flipAxis) {
    const calcDirection = flipAxis.cross(faceNormal)
    const worldDirection = this.cubeHelper.localToWorld(calcDirection)
    const planeDirection = this.planeHelper.worldToLocal(worldDirection)

    return this.getMaxAxis(planeDirection)
  }

  rotateLayer(rotation, move, flipType, callback) {

    const easing = this.flipEasings[flipType]
    const duration = this.flipSpeeds[flipType]
    const bounce = (flipType === 2) ? this.bounceCube() : (() => { })

    new Tween({
      easing,
      duration,
      onUpdate: tween => {
        let deltaAngle = tween.delta * rotation
        this.group.rotateOnAxis(this.flipAxis, deltaAngle)
        bounce(tween.value, deltaAngle, rotation)
      },
      onComplete: () => {
        if (move) this.onLayerMove()

        const layer = this.flipLayer.slice(0)

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

  rotateCubeFree() {
    const { acceleration, cameraDir, rotationSpeed, damping, cubeHelper, offsetHelper, world } = this

    if (Math.abs(acceleration.x) > 1e-6 || Math.abs(acceleration.y) > 1e-6) {
      const dragDir = offsetHelper.localToWorld(acceleration.clone()).normalize()
      const rotationAxis = _tempVector.copy(dragDir).cross(cameraDir).normalize()
      const rotationAngle = acceleration.length() * rotationSpeed

      _tempQuaternion.setFromAxisAngle(rotationAxis, rotationAngle)
      cubeHelper.applyQuaternion(_tempQuaternion)

      world.cube.object.quaternion.copy(cubeHelper.quaternion)

      acceleration.x *= (1 - damping)
      acceleration.y *= (1 - damping)
    }
  }

  rotateCubeFixed(rotation, callback) {
    const config = this.flipType
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

  getSalar() {
    return { 2: 6, 3: 3, 4: 4, 5: 3 }[this.world.cube.size]
  }

  getLayer(position, axis) {
    const scalar = this.getSalar()
    const layer = []

    if (!axis) {
      axis = this.getMaxAxis(position)
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

    this.flipAxis.set(0, 0, 0)
    this.flipAxis[move.axis] = 1

    this.selectLayer(layer)
    this.rotateLayer(move.angle, false, 0, () => {

      if (converted.length > 0) {
        this.scrambleCube()
      } else {
        this.scramble = null
        this.world.store.setState(STATE_TYPE.GAME, {
          [this.world.cube.size]: {
            cubeData: this.world.cube.data
          }
        })
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

  // 将角度圆整到 90° 的倍数
  roundAngle(angle) {
    const round = Math.PI / 2
    return Math.sign(angle) * Math.round(Math.abs(angle) / round) * round
  }

  snapRotation(rotationArray) {
    return rotationArray.map(value => Number.isFinite(value) ? this.roundAngle(value) : value)
  }

  // 检查魔方是否还原
  checkIsSolved() {
    let solved = true
    const sides = { 'x+': [], 'x-': [], 'y+': [], 'y-': [], 'z+': [], 'z-': [] }
    const { cube } = this.world

    // 找到位于同一个面的 edge
    cube.edges.forEach(edge => {
      const position = edge.parent.localToWorld(edge.position.clone())
      cube.object.worldToLocal(position)

      const axis = this.getMaxAxis(position)
      const sign = position[axis] > 0 ? '+' : '-'

      sides[axis + sign].push(edge.name)
    })

    // 判断每一个面上的 edge 方位是否都一致
    for (const side of Object.keys(sides)) {
      if (!sides[side].every(value => value === sides[side][0])) {
        solved = false
        break
      }
    }

    if (solved) this.onSolved()
  }
}