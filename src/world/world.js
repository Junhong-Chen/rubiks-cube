import Light from "./light"
import Floor from "./floor"
import UI from "./ui"
import Storage from "./storage"
import Scores from "./scores"
import Cube from './cube/cube'
import Themes from "./cube/themes"
import Scrambler from "./cube/scrambler"
import Controls from "./cube/controls"
import Tick from "../utils/tick"
import { SHOW, HIDE, START, STOP } from "../constants"

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

function buttonConcatDom(buttons, dom) {
  Object.values(buttons).map(arr => {
    if (arr.length) arr.forEach((name, i) => arr[i] = dom[name])
  })
}

export default class World {
  constructor(app) {

    this.dom = app.dom
    this.scene = app.scene
    this.debugger = app.debugger
    this.sizes = app.sizes
    this.camera = app.camera
    this.updateFns = []
    this.init()
  }

  init() {
    this.light = new Light(this)
    this.cube = new Cube(this)
    this.floor = new Floor(this)
    this.ui = new UI(this)
    this.tick = new Tick(this)
    this.scores = new Scores(this)

    this.storage = new Storage(this)
    this.themes = new Themes(this)
    this.scrambler = new Scrambler(this)
    this.controls = new Controls(this)

    this.state = STATE.MENU
    this.newGame = false
    this.saved = false
    this.initActions()

    this.storage.init()
    this.cube.init()
    this.ui.init()

    this.storage.loadGame()

    buttonConcatDom(BUTTONS, this.dom.buttons)

    setTimeout(() => {

      this.ui.float(START)
      this.ui.cube(SHOW)

      setTimeout(() => this.ui.title(SHOW), 700)
      setTimeout(() => this.ui.buttons(BUTTONS.MENU, BUTTONS.NONE), 1000)

    }, 500)
  }

  addUpdateFn(fn) {
    this.updateFns.push(fn)
  }

  removeUpdateFn(fn) {
    const i = this.updateFns.findIndex(el => el === fn)
    if (i >= 0) {
      this.updateFns.splice(i, 1)
    }
  }

  update(delta) {
    if (this.updateFns.length > 0) {
      this.updateFns.forEach(fn => fn(delta))
    }
  }

  initActions() {
    let tappedTwice = false

    this.dom.ui.addEventListener('click', event => {

      if (this.ui.activeTransitions > 0) return
      if (this.state === STATE.PLAYING) return

      if (this.state === STATE.MENU) {
        // 判断双击
        if (!tappedTwice) {
          tappedTwice = true
          setTimeout(() => tappedTwice = false, 300)
          return false

        }
        this.game(SHOW)
      } else if (this.state === STATE.COMPLETE) {
        this.complete(HIDE)
      } else if (this.state === STATE.STATS) {
        this.stats(HIDE)
      }

    }, false)

    // 扭动魔方后开始计时
    this.controls.onLayerMove = () => {
      if (this.newGame) {
        this.tick.start(true)
        this.newGame = false
      }
    }

    // 返回
    this.dom.buttons.back.onclick = () => {
      if (this.ui.activeTransitions > 0) return

      switch (this.state) {
        case STATE.PLAYING:
          this.game(HIDE)
          break
        case STATE.PREFS:
          this.prefs(HIDE)
          break
        case STATE.THEME:
          this.theme(HIDE)
          break
      }
    }

    // 设置
    this.dom.buttons.prefs.onclick = () => this.prefs(SHOW)

    // 记录
    this.dom.buttons.stats.onclick = () => this.stats(SHOW)

    // 完成
    this.controls.onSolved = () => this.complete(SHOW)
  }

  game(visible) {
    if (visible === SHOW) {
      if (!this.saved) {
        this.scrambler.scramble()
        this.controls.scrambleCube()
        this.newGame = true
      }

      const duration = this.saved ? 0 : this.scrambler.converted.length * (this.controls.flipSpeeds[0] + 10)

      this.state = STATE.PLAYING
      this.saved = true

      this.ui.buttons(BUTTONS.NONE, BUTTONS.MENU)
      this.ui.zoom(STATE.PLAYING, duration)
      this.ui.title(HIDE)
      this.ui.float(STOP)

      this.light.switch(Light.SWITCH.TURNON)

      setTimeout(() => {
        this.ui.tick(SHOW)
        this.ui.buttons(BUTTONS.PLAYING, BUTTONS.NONE)
      }, this.ui.durations.zoom - 1000)

      setTimeout(() => {
        this.controls.enable()
        if (!this.newGame) this.tick.start(true)
      }, this.ui.durations.zoom)

    } else {
      this.state = STATE.MENU

      this.ui.buttons(BUTTONS.MENU, BUTTONS.PLAYING)
      this.ui.zoom(STATE.MENU, 0)
      this.ui.float(START)

      this.controls.disable()
      if (!this.newGame) this.tick.stop()
      this.ui.tick(HIDE)

      this.light.switch(Light.SWITCH.TURNOFF, this.ui.durations.zoom)

      setTimeout(() => this.ui.title(SHOW), this.ui.durations.zoom - 1000)

      this.playing = false
      this.controls.disable()
    }
  }

  prefs(visible) {
    if (visible === SHOW) {
      if (this.ui.activeTransitions > 0) return

      this.state = STATE.PREFS

      this.ui.buttons(BUTTONS.PREFS, BUTTONS.MENU)

      this.ui.title(HIDE)
      this.ui.cube(HIDE)

      setTimeout(() => this.ui.preferences(SHOW), 1000)
    } else {
      this.cube.resize()

      this.state = STATE.MENU

      this.ui.buttons(BUTTONS.MENU, BUTTONS.PREFS)

      this.ui.preferences(HIDE)

      setTimeout(() => this.ui.cube(SHOW), 500)
      setTimeout(() => this.ui.title(SHOW), 1200)
    }
  }

  stats(visible) {
    if (visible === SHOW) {
      if (this.ui.activeTransitions > 0) return

      this.state = STATE.STATS

      this.ui.buttons(BUTTONS.STATS, BUTTONS.MENU)

      this.ui.title(HIDE)
      this.ui.cube(HIDE)

      setTimeout(() => this.ui.stats(SHOW), 1000)
    } else {
      this.state = STATE.MENU

      this.ui.buttons(BUTTONS.MENU, BUTTONS.NONE)

      this.ui.stats(HIDE)

      setTimeout(() => this.ui.cube(SHOW), 500)
      setTimeout(() => this.ui.title(SHOW), 1200)
    }
  }

  complete(visible) {
    if (visible === SHOW) {
      this.ui.buttons(BUTTONS.COMPLETE, BUTTONS.PLAYING)

      this.state = STATE.COMPLETE
      this.saved = false

      this.controls.disable()
      this.tick.stop()
      this.storage.clearGame()

      this.bestTime = this.scores.addScore(this.tick.deltaTime)

      this.ui.zoom(STATE.MENU, 0)
      this.ui.elevate(START)
      this.ui.float(START)

      this.light.switch(Light.SWITCH.TURNOFF, this.ui.durations.zoom)

      setTimeout(() => {
        this.ui.complete(SHOW, this.bestTime)
        // this.confetti.start()
      }, 1000)
    } else {
      this.state = STATE.STATS
      this.saved = false

      this.ui.tick(HIDE)
      this.ui.complete(HIDE, this.bestTime)
      this.ui.cube(HIDE)
      this.tick.reset()

      setTimeout(() => {
        this.cube.reset()
        // this.confetti.stop()

        this.ui.stats(SHOW)
        this.ui.elevate(STOP)
      }, 1000)

      return false
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