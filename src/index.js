import { Scene, PerspectiveCamera, WebGLRenderer, MathUtils, PCFSoftShadowMap } from "three"
import Sizes from "./utils/sizes"
import Timer from "./utils/timer"
// import Debugger from "./utils/debugger"
import Store, { STATE_TYPE } from "./utils/store"
import World from "./world/world"
// import { isWebGL2Supported } from "./utils/utils"

const $ = document.querySelector.bind(document)

const stage = { width: 2, height: 3, aspect: 2 / 3 }

// 禁用双指缩放
document.addEventListener('touchmove', (event) => {
  if (event.touches.length > 1) {
    event.preventDefault()
  }
}, { passive: false })

// 禁用双击放大
document.addEventListener('dblclick', (event) => {
  event.preventDefault()
}, false);

// 禁用双指缩放和双击放大
document.addEventListener('gesturestart', (event) => {
  event.preventDefault()
}, false)

class App {
  constructor() {
  }

  init() {
    // this.debugger = new Debugger()
    this.scene = new Scene()
    this.sizes = new Sizes()
    this.timer = new Timer()
    this.store = new Store()

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
        // theme: $('.btn-theme'),
        back: $('.btn-back'),
        reset: $('.btn-reset'),
        github: $('.btn-github')
      }
    }

    const { width, height } = this.sizes

    this.camera = new PerspectiveCamera(this.store.state[STATE_TYPE.PREFERENCES].cameraFov, width / height, 0.1, 1000)


    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.dom.cube.appendChild(this.renderer.domElement)
    this.dom.canvas = this.renderer.domElement

    this.resize()
    this.sizes.on('resize', this.resize.bind(this))

    this.timer.on('tick', this.update.bind(this))

    this.destroy = this.destroy.bind(this)
    window.addEventListener('beforeunload', this.destroy, false)

    this.world = new World(this)

    // debugger
    // if (this.debugger.gui) {
    //   const guiObj = {
    //     logCamera: () => console.log(this.camera)
    //   }
    //   this.debugger.gui.add(guiObj, 'logCamera')
    // }
  }

  update({ deltaTime }) {
    this.renderer.render(this.scene, this.camera)

    this.world.update(deltaTime)
  }

  resize() {
    const { width, height, pixelRatio } = this.sizes
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(pixelRatio)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    const fovRad = this.camera.fov * MathUtils.DEG2RAD
    let distance = (stage.aspect < this.camera.aspect)
      ? (stage.height / 2) / Math.tan(fovRad / 2)
      : (stage.width / this.camera.aspect) / (2 * Math.tan(fovRad / 2))
    distance *= 0.5
    this.camera.position.set(distance, distance, distance)
    this.camera.lookAt(this.scene.position)

    const docFontSize = stage.aspect < width / height ? height / 100 * stage.aspect : width / 100
    document.documentElement.style.fontSize = docFontSize + 'px'
  }

  destroy(e) {
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