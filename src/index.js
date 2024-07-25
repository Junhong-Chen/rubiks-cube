import { Scene, PerspectiveCamera, WebGLRenderer, MathUtils, PCFSoftShadowMap, AxesHelper } from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import Sizes from "./utils/sizes"
import Timer from "./utils/timer"
import World from "./world/world"
import Debugger from "./utils/debugger"

const $ = document.querySelector.bind(document)

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
        title: document.querySelector('.text-title'),
        note: document.querySelector('.text-note'),
        timer: document.querySelector('.text-timer'),
        complete: document.querySelector('.text-complete'),
        best: document.querySelector('.text-best-time'),
        theme: document.querySelector('.text-theme'),
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

    const stage = { width: 2, height: 3, aspect: 2 / 3 }
    const fovRad = this.camera.fov * MathUtils.DEG2RAD
    let distance = ( stage.aspect < this.camera.aspect )
      ? ( stage.height / 2 ) / Math.tan( fovRad / 2 )
      : ( stage.width / this.camera.aspect ) / ( 2 * Math.tan( fovRad / 2 ) )
    distance *= 0.5
    this.camera.position.set(distance, distance, distance)

    this.renderer = new WebGLRenderer({
      antialias: true
    })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.dom.cube.appendChild(this.renderer.domElement)

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.enableZoom = false
    this.orbitControls.enableDamping = true
    this.orbitControls.enablePan = false
    this.orbitControls.enabled = false
    this.orbitControls.dampingFactor = 0.15
    if (this.debugger.gui) this.debugger.gui.add(this.orbitControls, 'enabled')

    this.sizes.on('resize', this.resize)

    this.timer.on('tick', this.update)

    window.addEventListener('beforeunload', this.destroy, false)

    this.world = new World(this)
  }

  update = ({ deltaTime }) => {
    this.orbitControls.update()
    this.renderer.render(this.scene, this.camera)

    this.world.update(deltaTime)
  }

  resize = () => {
    const { width, height, pixelRatio } = this.sizes
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(pixelRatio)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  destroy = (e) => {
    // e.preventDefault()
    this.sizes.off('resize')
    this.timer.off('tick')
    this.debugger.destroy()
    this.sizes.destroy()
    this.timer.destroy()
    this.orbitControls.dispose()
    this.renderer.dispose()
    this.world.destroy()
    window.removeEventListener('beforeunload', this.destroy, false)
  }
}

const app = new App()
app.init()