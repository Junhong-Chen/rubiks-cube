import { Object3D, Mesh, Vector3, MeshStandardMaterial } from "three"
import { RoundedBoxGeometry } from "./roundedBoxGeometry.js"
import { RoundedPlaneGeometry } from "./roundedPlaneGeometry.js"
import { CUBE_DIRECTION } from "../../constants.js"

export default class Cube {
  #size = 3 // 阶层
  #scale = 1
  #gemotry = {
    pieceCornerRadius: 0.12,
    edgeCornerRoundness: 0.15,
    edgeScale: 0.85,
    edgeDepth: 0.001,
  }
  constructor(world) {
    this.world = world
    this.holder = new Object3D() // 控制浮动动画的的对象
    this.holder.name = 'holder'
    this.animator = new Object3D() // 控制旋转和平移动画的的对象
    this.animator.name = 'animator'
    this.object = new Object3D()

    this.holder.add(this.animator)
    this.animator.add(this.object)

    world.scene.add(this.holder)

    this.cubes = [] // 魔方的块
    this.edges = [] // 块上的面
    this.pieces = [] // 块 + 面
  }

  init() {
    switch (this.#size) {
      case 2:
        this.#scale = 1.25
        break
      case 3:
      case 4:
      case 5:
      default:
        this.#scale = 3 / this.#size
        break
    }
    this.object.scale.set(this.#scale, this.#scale, this.#scale)
    this.generatePositions()
    this.generateModel()

    this.pieces.forEach(piece => {
      this.cubes.push(piece.userData.cube)
      this.object.add(piece)
    })

    this.holder.traverse(node => {
      if (node.frustumCulled) node.frustumCulled = false
    })

    this.updateColors(this.world.themes.getColors())

    this.sizeGenerated = this.#size
  }


  reset() {
    this.holder.rotation.set(0, 0, 0)
    this.animator.rotation.set(0, 0, 0)
    this.object.rotation.set(0, 0, 0)

    this.world.controls.cubeHelper.rotation.set(0, 0, 0)
  }

  generatePositions() {
    const m = this.#size - 1
    const first = this.#size % 2 !== 0
      ? 0 - Math.floor(this.#size / 2)
      : 0.5 - this.#size / 2

    let x, y, z

    this.positions = []

    for (x = 0; x < this.#size; x++) {
      for (y = 0; y < this.#size; y++) {
        for (z = 0; z < this.#size; z++) {
          let position = new Vector3(first + x, first + y, first + z)
          let edges = []

          if (x === 0) edges.push(0)
          if (x === m) edges.push(1)
          if (y === 0) edges.push(2)
          if (y === m) edges.push(3)
          if (z === 0) edges.push(4)
          if (z === m) edges.push(5)

          position.edges = edges
          this.positions.push(position)
        }
      }
    }
  }

  generateModel() {
    const pieceSize = 1 / 3

    const material = new MeshStandardMaterial({
      roughness: 0.4,
      metalness: 0.6
    })

    const { pieceCornerRadius, edgeCornerRoundness, edgeScale, edgeDepth } = this.#gemotry
    const pieceMesh = new Mesh(
      new RoundedBoxGeometry(pieceSize, pieceCornerRadius, 3),
      material.clone()
    )
    pieceMesh.receiveShadow = true
    pieceMesh.castShadow = true

    const edgeGeometry = RoundedPlaneGeometry(
      pieceSize,
      edgeCornerRoundness,
      edgeDepth
    )

    this.positions.forEach((position, index) => {

      const piece = new Object3D()
      const pieceCube = pieceMesh.clone()
      const pieceEdges = []

      // 标准化魔方的范围为 [-1, 1]
      piece.position.copy(position.clone().divideScalar(3))
      piece.add(pieceCube)
      piece.name = index

      position.edges.forEach(position => {

        const edge = new Mesh(edgeGeometry, material.clone())

        const name = CUBE_DIRECTION[position]
        const distance = pieceSize / 2

        edge.position.set(
          distance * [- 1, 1, 0, 0, 0, 0][position],
          distance * [0, 0, - 1, 1, 0, 0][position],
          distance * [0, 0, 0, 0, - 1, 1][position]
        )

        edge.rotation.set(
          Math.PI / 2 * [0, 0, 1, - 1, 0, 0][position],
          Math.PI / 2 * [- 1, 1, 0, 0, 2, 0][position],
          0
        )

        edge.scale.set(
          edgeScale,
          edgeScale,
          edgeScale
        )

        edge.name = name

        piece.add(edge)
        pieceEdges.push(name)
        this.edges.push(edge)

      })

      piece.userData.edges = pieceEdges
      piece.userData.cube = pieceCube

      piece.userData.start = {
        position: piece.position.clone(),
        rotation: piece.rotation.clone(),
      }

      this.pieces.push(piece)

    })
  }

  updateColors(colors) {
    if (typeof this.pieces !== 'object' && typeof this.edges !== 'object') return

    this.pieces.forEach(piece => piece.userData.cube.material.color.setHex(colors.P))
    this.edges.forEach(edge => edge.material.color.setHex(colors[edge.name]))
  }
}