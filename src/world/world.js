import Light from "./light"
import Floor from "./floor"
import Cube from './cube/cube'
import Storage from "./cube/storage"
import Themes from "./cube/themes"
import Scrambler from "./cube/scrambler"
import Controller from "./cube/controls"

export default class World {
  constructor(app) {
    this.scene = app.scene
    this.debugger = app.debugger
    this.timer = app.timer
    this.sizes = app.sizes
    this.camera = app.camera
    this.orbitControls = app.orbitControls
    this.init()
  }

  init() {
    this.light = new Light(this)
    this.cube = new Cube(this)
    this.floor = new Floor(this)

    this.storage = new Storage(this)
    this.themes = new Themes(this)
    this.scrambler = new Scrambler(this)
    this.controller = new Controller(this)

    this.storage.init()
    this.cube.init()

    this.storage.loadGame()
  }

  update(deltaTime) {
  }

  destroy() {
    this.scene.traverse(child => {
      if (child.isMesh) {
        child.geometry.dispose()
        for (const key in child.material) {
          const value = child.material[key]
          if (value && value.dispose instanceof Function) {
            value.dispose()
          }
        }
      }
    })
  }
}