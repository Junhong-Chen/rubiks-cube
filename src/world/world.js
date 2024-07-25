import Light from "./light"
import Floor from "./floor"
import UIController from "./ui"
import Cube from './cube/cube'
import Storage from "./cube/storage"
import Themes from "./cube/themes"
import Scrambler from "./cube/scrambler"
import Controller from "./cube/controls"
import Timer from "./timer"

const SHOW = true
const HIDE = false

const STATE = {
  MENU: 0,
  PLAYING: 1,
  COMPLETE: 2,
  STATS: 3,
  PREFS: 4,
  THEME: 5,
}

const BUTTONS = {
  MENU: ['stats', 'prefs'],
  PLAYING: ['back'],
  COMPLETE: [],
  STATS: [],
  PREFS: ['back', 'theme'],
  THEME: ['back', 'reset'],
  NONE: [],
}


export default class World {
  constructor(app) {
    this.dom = app.dom
    this.scene = app.scene
    this.debugger = app.debugger
    this.sizes = app.sizes
    this.camera = app.camera
    this.orbitControls = app.orbitControls
    this.init()
  }

  init() {
    this.light = new Light(this)
    this.cube = new Cube(this)
    this.floor = new Floor(this)
    this.ui = new UIController(this)
    this.timer = new Timer(this)

    this.state = STATE.MENU
    this.initActions()

    this.storage = new Storage(this)
    this.themes = new Themes(this)
    this.scrambler = new Scrambler(this)
    this.controller = new Controller(this)

    this.storage.init()
    this.cube.init()
    this.ui.init()

    this.storage.loadGame()

    setTimeout(() => {

      this.ui.float()
      this.ui.cube(SHOW)

      setTimeout(() => this.ui.title(SHOW), 700)
      setTimeout(() => this.ui.buttons(BUTTONS.MENU, BUTTONS.NONE), 1000)

    }, 500)
  }

  update(deltaTime) {
  }

  initActions() {
    let tappedTwice = false

    this.dom.ui.addEventListener('click', event => {

      if (this.ui.activeTransitions > 0) return
      if (this.state === STATE.PLAYING) return

      if (this.state === STATE.MENU) {
        if (!tappedTwice) {
          tappedTwice = true
          setTimeout(() => tappedTwice = false, 300)
          return false

        }
        this.start(SHOW)
      } else if (this.state === STATE.COMPLETE) {
        this.complete(HIDE)
      } else if (this.state === STATE.STATS) {
        this.stats(HIDE)
      }

    }, false)
  }

  start(show) {
    if (show) {
      if (!this.saved) {
        this.scrambler.scramble()
        this.controller.scrambleCube()
        this.newGame = true
      }

      const duration = this.saved ? 0 : this.scrambler.converted.length * (this.controller.flipSpeeds[0] + 10)

      this.state = STATE.PLAYING
      this.saved = true

      this.ui.buttons(BUTTONS.NONE, BUTTONS.MENU)

      this.ui.zoom(STATE.PLAYING, duration)
      this.ui.title(HIDE)
      this.ui.tweens.float.stop()
      
      this.light.switch(Light.SWITCH.TURNON)

      setTimeout(() => {
        this.ui.timer(SHOW)
        this.ui.buttons(BUTTONS.PLAYING, BUTTONS.NONE)
      }, this.ui.durations.zoom - 1000)

      setTimeout(() => {
        this.controller.enable()
        if (!this.newGame) this.timer.start(true)
      }, this.ui.durations.zoom)

    } else {
      this.state = STATE.MENU

      this.ui.buttons(BUTTONS.MENU, BUTTONS.PLAYING)

      this.ui.zoom(STATE.MENU, 0)

      this.controller.disable()
      if (!this.newGame) this.timer.stop()
      this.ui.timer(HIDE)

      setTimeout(() => this.ui.title(SHOW), this.ui.durations.zoom - 1000)

      this.playing = false
      this.controller.disable()
    }
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