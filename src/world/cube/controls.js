import { Vector2, Vector3, Matrix4, Mesh, Object3D, Raycaster, MeshBasicMaterial, PlaneGeometry, BoxGeometry, DoubleSide } from "three"
import { Tween, Easing } from "../../utils/tween.js"
import Draggable from "./draggable.js"

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

export default class Controls {
  constructor(world) {

    this.world = world

    this.flipConfig = 0

    this.flipEasings = [Easing.Power.Out(3), Easing.Sine.Out(), Easing.Back.Out(1.5)]
    this.flipSpeeds = [125, 200, 300]

    this.raycaster = new Raycaster()

    const helperMaterial = new MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0, color: 0x00ffff, side: DoubleSide })

    this.group = new Object3D()
    this.group.name = 'controls'
    this.world.cube.object.add(this.group)

    this.helper = new Mesh(
      new PlaneGeometry(64, 64),
      helperMaterial.clone()
    )
    this.helper.name = 'helper'

    this.helper.rotation.set(0, Math.PI / 4, 0)
    this.world.scene.add(this.helper)

    this.edges = new Mesh(
      new BoxGeometry(1, 1, 1),
      helperMaterial.clone(),
    )

    this.world.scene.add(this.edges)

    this.onSolved = () => { }
    this.onMove = () => { }

    this.momentum = []

    this.scramble = null
    this.state = STATE.STILL
    this.enabled = false

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

  initDraggable() {
    this.draggable = new Draggable(document.body)

    this.draggable.onDragStart = position => {
      if (this.scramble !== null) return
      if (this.state === STATE.PREPARING || this.state === STATE.ROTATING) return

      this.gettingDrag = this.state === STATE.ANIMATING

      const edgeIntersect = this.getIntersect(position.current, this.edges, false)

      if (edgeIntersect !== false) {
        this.dragIntersect = this.getIntersect(position.current, this.world.cube.cubes, true)
      }

      if (edgeIntersect !== false && this.dragIntersect !== false) {
        this.dragNormal = edgeIntersect.face.normal.round()
        const worldDragNormal = this.dragNormal.clone().applyMatrix4(this.edges.matrixWorld)
        this.flipType = RotateType.LAYER
        // this.world.orbitControls.enabled = false

        this.helper.rotation.set(0, 0, 0)
        this.helper.position.set(0, 0, 0)
        this.helper.lookAt(worldDragNormal)
        this.helper.translateZ(0.5)
        this.helper.updateMatrixWorld()
      } else { // 点击空白处
        this.dragNormal = new Vector3(0, 0, 1)
        this.flipType = RotateType.CUBE

        this.helper.position.set(0, 0, 0)
        this.helper.rotation.set(0, Math.PI / 4, 0)
        this.helper.updateMatrixWorld()
      }

      let planeIntersect = this.getIntersect(position.current, this.helper, false)
      if (planeIntersect === false) return

      this.dragCurrent = this.helper.worldToLocal(planeIntersect.point)
      this.dragTotal = new Vector3()
      this.state = (this.state === STATE.STILL) ? STATE.PREPARING : this.state
    }

    this.draggable.onDragMove = position => {
      if (this.scramble !== null) return
      if (this.state === STATE.STILL || (this.state === STATE.ANIMATING && this.gettingDrag === false)) return

      const planeIntersect = this.getIntersect(position.current, this.helper, false)
      if (planeIntersect === false) return

      const point = this.helper.worldToLocal(planeIntersect.point.clone())

      this.dragDelta = point.clone().sub(this.dragCurrent).setZ(0)
      this.dragTotal.add(this.dragDelta)
      this.dragCurrent = point
      this.addMomentumPoint(this.dragDelta)

      if (this.state === STATE.PREPARING && this.dragTotal.length() > 0.05) {
        this.dragDirection = this.getMainAxis(this.dragTotal)

        // 计算旋转轴
        if (this.flipType === RotateType.LAYER) {
          const direction = new Vector3()
          direction[this.dragDirection] = 1

          const worldDirection = this.helper.localToWorld(direction).sub(this.helper.position)
          const objectDirection = this.edges.worldToLocal(worldDirection).round()

          this.flipAxis = objectDirection.cross(this.dragNormal).negate()

          this.selectLayer(this.getLayer())
        } else {
          const axis = (this.dragDirection != 'x')
            ? ((this.dragDirection == 'y' && position.current.x > this.world.sizes.width / 2) ? 'z' : 'x')
            : 'y'

          this.flipAxis = new Vector3()
          this.flipAxis[axis] = axis === 'x' ? - 1 : 1
        }

        this.flipAngle = 0
        this.state = STATE.ROTATING
      } else if (this.state === STATE.ROTATING) {
        const rotation = this.dragDelta[this.dragDirection]

        if (this.flipType === RotateType.LAYER) {
          this.group.rotateOnAxis(this.flipAxis, rotation)
          this.flipAngle += rotation
        } else {
          this.edges.rotateOnWorldAxis(this.flipAxis, rotation)
          this.world.cube.object.rotation.copy(this.edges.rotation)
          this.flipAngle += rotation
        }
      }
    }

    this.draggable.onDragEnd = position => {
      // this.world.orbitControls.enabled = true
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

        this.world.cube.object.rotation.fromArray(this.snapRotation(this.world.cube.object.rotation.toArray()))
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
    const config = this.flipConfig
    const easing = [Easing.Power.Out(4), Easing.Sine.Out(), Easing.Back.Out(2)][config]
    const duration = [100, 150, 350][config]

    new Tween({
      easing: easing,
      duration: duration,
      onUpdate: tween => {
        this.edges.rotateOnWorldAxis(this.flipAxis, tween.delta * rotation)
        this.world.cube.object.rotation.copy(this.edges.rotation)
      },
      onComplete: () => {
        this.edges.rotation.fromArray(this.snapRotation(this.edges.rotation.toArray()))
        this.world.cube.object.rotation.copy(this.edges.rotation)
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

      if (piecePosition[axis] == position[axis]) layer.push(piece.name)
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
      this.draggable.convertPosition(position.clone()),
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

    this.momentum = this.momentum.filter(moment => time - moment.time < 500)

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
}