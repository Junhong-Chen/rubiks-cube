import { Scene, PerspectiveCamera, WebGLRenderer, MathUtils, PCFSoftShadowMap } from "three"
import Sizes from "./utils/sizes"
import Timer from "./utils/timer"
import World from "./world/world"
import Debugger from "./utils/debugger"

const $ = document.querySelector.bind(document)

const stage = { width: 2, height: 3, aspect: 2 / 3 }

class App {
  constructor() {
  }

  init() {
    this.debugger = new Debugger()
    this.scene = new Scene()
    this.sizes = new Sizes()
    this.timer = new Timer()

    this.dom = {
      ui: $('#ui'),
      cube: $('#cube'),
      stats: $('#stats'),
      prefs: $('#prefs'),
      theme: $('#theme'),
      texts: {
        title: $('.text-title'),
        note: $('.text-note'),
        tick: $('.text-tick'),
        complete: $('.text-complete'),
        best: $('.text-best-time'),
        theme: $('.text-theme'),
      },
      buttons: {
        stats: $('.btn-stats'),
        prefs: $('.btn-prefs'),
        theme: $('.btn-theme'),
        back: $('.btn-back'),
        reset: $('.btn-reset'),
      }
    }

    const { width, height, pixelRatio } = this.sizes

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000)

    const fovRad = this.camera.fov * MathUtils.DEG2RAD
    let distance = (stage.aspect < this.camera.aspect)
      ? (stage.height / 2) / Math.tan(fovRad / 2)
      : (stage.width / this.camera.aspect) / (2 * Math.tan(fovRad / 2))
    distance *= 0.5
    this.camera.position.set(distance, distance, distance)
    this.camera.lookAt(this.scene.position)

    const docFontSize = stage.aspect < width / height ? height / 100 * stage.aspect : width / 100
    document.documentElement.style.fontSize = docFontSize + 'px'

    this.renderer = new WebGLRenderer({
      antialias: true
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.dom.cube.appendChild(this.renderer.domElement)
    this.dom.canvas = this.renderer.domElement

    this.sizes.on('resize', this.resize)

    this.timer.on('tick', this.update)

    window.addEventListener('beforeunload', this.destroy, false)

    this.world = new World(this)
  }

  update = ({ deltaTime }) => {
    this.renderer.render(this.scene, this.camera)

    this.world.update(deltaTime)
  }

  resize = () => {
    const { width, height, pixelRatio } = this.sizes
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(pixelRatio)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const docFontSize = stage.aspect < width / height ? height / 100 * stage.aspect : width / 100
    document.documentElement.style.fontSize = docFontSize + 'px'
  }

  destroy = (e) => {
    // e.preventDefault()
    this.sizes.off('resize')
    this.timer.off('tick')
    this.debugger.destroy()
    this.sizes.destroy()
    this.timer.destroy()
    this.renderer.dispose()
    this.world.destroy()
    window.removeEventListener('beforeunload', this.destroy, false)
  }
}

const app = new App()
app.init()