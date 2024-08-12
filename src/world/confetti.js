
import { Uniform, Spherical, Vector2, Vector3, BufferGeometry, RawShaderMaterial, BufferAttribute, Points, Color, Matrix4 } from 'three'
import vertexShader from '../shaders/confetti/vertex.vs.glsl'
import fragmentShader from '../shaders/confetti/fragment.fs.glsl'
import { random } from "../utils/utils"
import { Tween, Easing } from "../utils/tween"

const TYPE = {
  EXPLOSION: 'explosion',
  FALL: 'fall'
}

export default class Confetti {
  constructor(wolrd) {
    this.wolrd = wolrd

    this.boundary = this.getBoundary()
    this.update = null
    this.explosion = null
    this.fall = null
  }

  generate({
    type,
    position,
    count,
    size,
    colors,
    radius
  }) {
    const positionsArray = new Float32Array(count * 3)
    const axesArray = new Float32Array(count * 3)
    const timeMultiplierArray = new Float32Array(count)
    const colorRandomness = new Float32Array(count)
    const spherePosition = new Vector3()

    const { pixelRatio, width, height, aspect } = this.wolrd.sizes

    for (let i = 0; i < count; i++) {
      const j = i * 3

      switch (type) {
        case TYPE.EXPLOSION: {
          const spherical = new Spherical(
            radius * Math.pow(Math.random(), 0.1),
            Math.random() * Math.PI * aspect / 4,
            Math.PI / 2 + Math.random() * Math.PI,
          )

          spherePosition.setFromSpherical(spherical)

          positionsArray[j + 0] = spherePosition.x
          positionsArray[j + 1] = spherePosition.y
          positionsArray[j + 2] = spherePosition.z
          break
        }
        case TYPE.FALL:
          positionsArray[j + 0] = random(-1, 1)
          positionsArray[j + 1] = random(1, 4)
          positionsArray[j + 2] = random(-1, 1)
          break
      }

      // 设置随机旋转轴
      const axis = new Vector3(Math.random(), Math.random(), Math.random()).normalize()
      axesArray[j + 0] = axis.x
      axesArray[j + 1] = axis.y
      axesArray[j + 2] = axis.z

      timeMultiplierArray[i] = 1 + Math.random()
      colorRandomness[i] = ~~random(0, 6)
    }

    const geometry = new BufferGeometry()
    const material = new RawShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uSize: new Uniform(size),
        uPixelRatio: new Uniform(pixelRatio),
        uResolution: new Uniform(new Vector2(width, height)),
        uColors: new Uniform(colors),
        uProgress: new Uniform(0),
        uFall: new Uniform(type === TYPE.FALL)
      }
    })

    geometry.setAttribute('position', new BufferAttribute(positionsArray, 3))
    geometry.setAttribute('axis', new BufferAttribute(axesArray, 3))
    geometry.setAttribute('aTimeMultiplier', new BufferAttribute(timeMultiplierArray, 1))
    geometry.setAttribute('aColorRandomness', new BufferAttribute(colorRandomness, 1))

    const confetti = new Points(
      geometry,
      material
    )

    if (position) confetti.position.copy(position)
    confetti.lookAt(this.wolrd.camera.position)

    return confetti
  }

  play() {
    const themeColors = this.wolrd.themes.colors
    const aspect = this.wolrd.sizes.aspect
    const colors = [themeColors.U, themeColors.D, themeColors.F, themeColors.R, themeColors.B, themeColors.L].map(c => new Color(c))
    const radius = Math.abs(this.boundary.y) * (aspect > 2.2 ? aspect : 2.2)

    this.explosion = this.generate({
      type: TYPE.EXPLOSION,
      position: new Vector3(0, -this.boundary.y, 0),
      count: 150,
      size: 0.2,
      colors,
      radius,
    })

    this.fall = this.generate({
      type: TYPE.FALL,
      count: 200,
      size: 0.1,
      colors,
    })

    this.wolrd.scene.add(this.explosion)
    this.wolrd.scene.add(this.fall)

    new Tween({
      target: this.explosion.material.uniforms.uProgress,
      duration: 8000,
      to: { value: 1 },
      onComplete: () => {
        if (this.explosion) {
          this.wolrd.scene.remove(this.explosion)
          this.explosion.geometry.dispose()
          this.explosion.material.dispose()
          this.explosion = null
        }
      },
    })

    if (this.update) this.wolrd.removeUpdateFn(this.update)
    this.update = (delta) => {
      this.fall.material.uniforms.uProgress.value += delta
    }

    setTimeout(() => {
      this.wolrd.addUpdateFn(this.update)
    }, 800)
  }

  getBoundary() {
    const { camera } = this.wolrd

    // 获取相机的投影矩阵
    const projectionMatrix = camera.projectionMatrix

    // 获取视图矩阵（模型视图矩阵）
    const viewMatrix = camera.matrixWorldInverse

    // MVP 矩阵
    const mvpMatrix = new Matrix4().multiplyMatrices(projectionMatrix, viewMatrix)

    // MVP 逆矩阵
    const inverseMvpMatrix = mvpMatrix.invert()

    return new Vector3(-1, -1, 0).applyMatrix4(inverseMvpMatrix)
  }

  stop() {
    let delay = 0
    if (this.explosion) {
      delay = (1 - this.explosion.material.uniforms.uProgress.value) * 8000
    }

    new Tween({
      target: this.fall.material.uniforms.uSize,
      delay,
      easing: Easing.Power.Out(),
      duration: 800,
      to: { value: 0 },
      onComplete: () => {
        this.destroy()
      },
    })
  }

  destroy() {
    this.wolrd.removeUpdateFn(this.update)

    if (this.fall) {
      this.wolrd.scene.remove(this.fall)
      this.fall.geometry.dispose()
      this.fall.material.dispose()
      this.fall = null
    }
  }
}