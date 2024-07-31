import { BufferGeometry, Vector3, BufferAttribute, Shape, ExtrudeGeometry } from "three"

export class RoundedPlaneGeometry extends ExtrudeGeometry {

  constructor(size, radius, depth) {
    let x, y, width, height

    x = y = - size / 2
    width = height = size
    radius = size * radius

    const shape = new Shape()

    shape.moveTo(x, y + radius)
    shape.lineTo(x, y + height - radius)
    shape.quadraticCurveTo(x, y + height, x + radius, y + height)
    shape.lineTo(x + width - radius, y + height)
    shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
    shape.lineTo(x + width, y + radius)
    shape.quadraticCurveTo(x + width, y, x + width - radius, y)
    shape.lineTo(x + radius, y)
    shape.quadraticCurveTo(x, y, x, y + radius)

    super(shape, { depth: depth, bevelEnabled: false, curveSegments: 3 })
    
    this.type = 'RoundedPlaneGeometry'
  }
}

export class RoundedBoxGeometry extends BufferGeometry {
  constructor(size, radius, radiusSegments) {
    super()
    this.type = 'RoundedBoxGeometry'

    this.radiusSegments = radiusSegments = !isNaN(radiusSegments) ? Math.max(1, Math.floor(radiusSegments)) : 1

    let width, height, depth
    width = height = depth = size
    radius = size * radius
    this.radius = radius = Math.min(radius, Math.min(width, Math.min(height, Math.min(depth))) / 2)

    this.edgeHalfWidth = width / 2 - radius
    this.edgeHalfHeight = height / 2 - radius
    this.edgeHalfDepth = depth / 2 - radius

    this.parameters = {
      width,
      height,
      depth,
      radius,
      radiusSegments
    }

    const rs1 = this.rs1 = radiusSegments + 1
    const totalVertexCount = (rs1 * radiusSegments + 1) << 3

    const positions = new BufferAttribute(new Float32Array(totalVertexCount * 3), 3)
    const normals = new BufferAttribute(new Float32Array(totalVertexCount * 3), 3)

    this.cornerVerts = []
    this.cornerNormals = []
    this.normal = new Vector3()
    this.vertex = new Vector3()
    this.vertexPool = []
    this.normalPool = []
    this.indices = []

    this.lastVertex = rs1 * radiusSegments
    this.cornerVertNumber = rs1 * radiusSegments + 1

    this.doVertices()
    this.doFaces()
    this.doCorners()
    this.doHeightEdges()
    this.doWidthEdges()
    this.doDepthEdges()

    for (let i = 0; i < this.vertexPool.length; i++) {
      positions.setXYZ(
        i,
        this.vertexPool[i].x,
        this.vertexPool[i].y,
        this.vertexPool[i].z
      )

      normals.setXYZ(
        i,
        this.normalPool[i].x,
        this.normalPool[i].y,
        this.normalPool[i].z
      )
    }

    this.setIndex(new BufferAttribute(new Uint16Array(this.indices), 1))
    this.setAttribute('position', positions)
    this.setAttribute('normal', normals)
  }

  doVertices() {
    const cornerLayout = [
      new Vector3(1, 1, 1),
      new Vector3(1, 1, - 1),
      new Vector3(- 1, 1, - 1),
      new Vector3(- 1, 1, 1),
      new Vector3(1, - 1, 1),
      new Vector3(1, - 1, - 1),
      new Vector3(- 1, - 1, - 1),
      new Vector3(- 1, - 1, 1)
    ]

    for (let j = 0; j < 8; j++) {
      this.cornerVerts.push([])
      this.cornerNormals.push([])
    }

    const PIhalf = Math.PI / 2
    const cornerOffset = new Vector3(this.edgeHalfWidth, this.edgeHalfHeight, this.edgeHalfDepth)

    for (let y = 0; y <= this.radiusSegments; y++) {
      const v = y / this.radiusSegments
      const va = v * PIhalf
      const cosVa = Math.cos(va)
      const sinVa = Math.sin(va)

      if (y === this.radiusSegments) {

        this.vertex.set(0, 1, 0)
        const vert = this.vertex.clone().multiplyScalar(this.radius).add(cornerOffset)
        this.cornerVerts[0].push(vert)
        this.vertexPool.push(vert)
        const norm = this.vertex.clone()
        this.cornerNormals[0].push(norm)
        this.normalPool.push(norm)
        continue

      }

      for (let x = 0; x <= this.radiusSegments; x++) {
        const u = x / this.radiusSegments
        const ha = u * PIhalf
        this.vertex.x = cosVa * Math.cos(ha)
        this.vertex.y = sinVa
        this.vertex.z = cosVa * Math.sin(ha)

        const vert = this.vertex.clone().multiplyScalar(this.radius).add(cornerOffset)
        this.cornerVerts[0].push(vert)
        this.vertexPool.push(vert)

        const norm = this.vertex.clone().normalize()
        this.cornerNormals[0].push(norm)
        this.normalPool.push(norm)
      }
    }

    for (let i = 1; i < 8; i++) {
      for (let j = 0; j < this.cornerVerts[0].length; j++) {
        const vert = this.cornerVerts[0][j].clone().multiply(cornerLayout[i])
        this.cornerVerts[i].push(vert)
        this.vertexPool.push(vert)

        const norm = this.cornerNormals[0][j].clone().multiply(cornerLayout[i])
        this.cornerNormals[i].push(norm)
        this.normalPool.push(norm)
      }
    }
  }

  doCorners() {
    const flips = [
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true
    ]

    const lastRowOffset = this.rs1 * (this.radiusSegments - 1)

    for (let i = 0; i < 8; i++) {
      const cornerOffset = this.cornerVertNumber * i

      for (let v = 0; v < this.radiusSegments - 1; v++) {
        const r1 = v * this.rs1
        const r2 = (v + 1) * this.rs1

        for (let u = 0; u < this.radiusSegments; u++) {
          const u1 = u + 1
          const a = cornerOffset + r1 + u
          const b = cornerOffset + r1 + u1
          const c = cornerOffset + r2 + u
          const d = cornerOffset + r2 + u1

          if (!flips[i]) {
            this.indices.push(a)
            this.indices.push(b)
            this.indices.push(c)

            this.indices.push(b)
            this.indices.push(d)
            this.indices.push(c)
          } else {
            this.indices.push(a)
            this.indices.push(c)
            this.indices.push(b)

            this.indices.push(b)
            this.indices.push(c)
            this.indices.push(d)
          }
        }
      }

      for (let u = 0; u < this.radiusSegments; u++) {
        const a = cornerOffset + lastRowOffset + u
        const b = cornerOffset + lastRowOffset + u + 1
        const c = cornerOffset + this.lastVertex

        if (!flips[i]) {
          this.indices.push(a)
          this.indices.push(b)
          this.indices.push(c)
        } else {
          this.indices.push(a)
          this.indices.push(c)
          this.indices.push(b)
        }
      }
    }
  }

  doFaces() {
    let a = this.lastVertex
    let b = this.lastVertex + this.cornerVertNumber
    let c = this.lastVertex + this.cornerVertNumber * 2
    let d = this.lastVertex + this.cornerVertNumber * 3

    this.indices.push(a)
    this.indices.push(b)
    this.indices.push(c)
    this.indices.push(a)
    this.indices.push(c)
    this.indices.push(d)

    a = this.lastVertex + this.cornerVertNumber * 4
    b = this.lastVertex + this.cornerVertNumber * 5
    c = this.lastVertex + this.cornerVertNumber * 6
    d = this.lastVertex + this.cornerVertNumber * 7

    this.indices.push(a)
    this.indices.push(c)
    this.indices.push(b)
    this.indices.push(a)
    this.indices.push(d)
    this.indices.push(c)
    a = 0
    b = this.cornerVertNumber
    c = this.cornerVertNumber * 4
    d = this.cornerVertNumber * 5

    this.indices.push(a)
    this.indices.push(c)
    this.indices.push(b)
    this.indices.push(b)
    this.indices.push(c)
    this.indices.push(d)

    a = this.cornerVertNumber * 2
    b = this.cornerVertNumber * 3
    c = this.cornerVertNumber * 6
    d = this.cornerVertNumber * 7

    this.indices.push(a)
    this.indices.push(c)
    this.indices.push(b)
    this.indices.push(b)
    this.indices.push(c)
    this.indices.push(d)

    a = this.radiusSegments
    b = this.radiusSegments + this.cornerVertNumber * 3
    c = this.radiusSegments + this.cornerVertNumber * 4
    d = this.radiusSegments + this.cornerVertNumber * 7

    this.indices.push(a)
    this.indices.push(b)
    this.indices.push(c)
    this.indices.push(b)
    this.indices.push(d)
    this.indices.push(c)

    a = this.radiusSegments + this.cornerVertNumber
    b = this.radiusSegments + this.cornerVertNumber * 2
    c = this.radiusSegments + this.cornerVertNumber * 5
    d = this.radiusSegments + this.cornerVertNumber * 6

    this.indices.push(a)
    this.indices.push(c)
    this.indices.push(b)
    this.indices.push(b)
    this.indices.push(c)
    this.indices.push(d)

  }

  doHeightEdges() {
    for (let i = 0; i < 4; i++) {
      const cOffset = i * this.cornerVertNumber
      const cRowOffset = 4 * this.cornerVertNumber + cOffset
      const needsFlip = i & 1 === 1

      for (let u = 0; u < this.radiusSegments; u++) {
        const u1 = u + 1
        const a = cOffset + u
        const b = cOffset + u1
        const c = cRowOffset + u
        const d = cRowOffset + u1

        if (!needsFlip) {
          this.indices.push(a)
          this.indices.push(b)
          this.indices.push(c)
          this.indices.push(b)
          this.indices.push(d)
          this.indices.push(c)
        } else {
          this.indices.push(a)
          this.indices.push(c)
          this.indices.push(b)
          this.indices.push(b)
          this.indices.push(c)
          this.indices.push(d)
        }
      }
    }
  }

  doDepthEdges() {
    const cStarts = [0, 2, 4, 6]
    const cEnds = [1, 3, 5, 7]

    for (let i = 0; i < 4; i++) {
      const cStart = this.cornerVertNumber * cStarts[i]
      const cEnd = this.cornerVertNumber * cEnds[i]

      const needsFlip = 1 >= i

      for (let u = 0; u < this.radiusSegments; u++) {
        const urs1 = u * this.rs1
        const u1rs1 = (u + 1) * this.rs1

        const a = cStart + urs1
        const b = cStart + u1rs1
        const c = cEnd + urs1
        const d = cEnd + u1rs1

        if (needsFlip) {
          this.indices.push(a)
          this.indices.push(c)
          this.indices.push(b)
          this.indices.push(b)
          this.indices.push(c)
          this.indices.push(d)
        } else {
          this.indices.push(a)
          this.indices.push(b)
          this.indices.push(c)
          this.indices.push(b)
          this.indices.push(d)
          this.indices.push(c)
        }
      }
    }
  }

  doWidthEdges() {
    const end = this.radiusSegments - 1

    const cStarts = [0, 1, 4, 5]
    const cEnds = [3, 2, 7, 6]
    const needsFlip = [0, 1, 1, 0]

    for (let i = 0; i < 4; i++) {
      const cStart = cStarts[i] * this.cornerVertNumber
      const cEnd = cEnds[i] * this.cornerVertNumber

      for (let u = 0; u <= end; u++) {
        const a = cStart + this.radiusSegments + u * this.rs1
        const b = cStart + (u != end ? this.radiusSegments + (u + 1) * this.rs1 : this.cornerVertNumber - 1)

        const c = cEnd + this.radiusSegments + u * this.rs1
        const d = cEnd + (u != end ? this.radiusSegments + (u + 1) * this.rs1 : this.cornerVertNumber - 1)

        if (!needsFlip[i]) {
          this.indices.push(a)
          this.indices.push(b)
          this.indices.push(c)
          this.indices.push(b)
          this.indices.push(d)
          this.indices.push(c)
        } else {
          this.indices.push(a)
          this.indices.push(c)
          this.indices.push(b)
          this.indices.push(b)
          this.indices.push(c)
          this.indices.push(d)
        }
      }
    }
  }
}
