import { HIDE, SHOW } from "../constants.js"
import { Animation } from "../utils/animation.js"
import { STATE_TYPE } from "./store.js"

export default class Tick extends Animation {

  constructor(world) {
    super(false)

    this.world = world

    this.ticking = false
    this.startTime
    this.currentTime
    this.deltaTime
    this.time = '00:00:00'
    this.prev = '00:00:00'

    const $ = document.body.querySelectorAll.bind(this.world.dom.texts.tick)
    this.dom = [
      Array.from($('.hour')).map(el => { return { el, above: el.querySelector('.above'), below: el.querySelector('.below') } }),
      Array.from($('.minute')).map(el => { return { el, above: el.querySelector('.above'), below: el.querySelector('.below') } }),
      Array.from($('.second')).map(el => { return { el, above: el.querySelector('.above'), below: el.querySelector('.below') } }),
    ]

    this.reset()
  }

  reset() {
    this.startTime = 0
    this.currentTime = 0
    // this.deltaTime = 0
    this.setTime(0)
  }

  start(continueGame) {
    if (!this.ticking) {
      this.ticking = true
      this.startTime = continueGame ? (Date.now() - this.deltaTime) : Date.now()

      super.start()
    }
  }

  stop() {
    if (this.ticking) {
      this.ticking = false
      this.currentTime = Date.now()
      this.deltaTime = this.currentTime - this.startTime
      this.time = this.convert()

      super.stop()
    }
  }

  update() {
    this.prev = this.time

    this.currentTime = Date.now()
    this.deltaTime = this.currentTime - this.startTime
    this.time = this.convert()

    if (this.time !== this.prev) {
      this.setText()

      this.world.store.setState(STATE_TYPE.GAME, {
        [this.world.cube.size]: {
          time: this.deltaTime
        }
      })
    }
  }

  convert() {
    const totalSeconds = Math.floor(this.deltaTime / 1000)
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, 0)
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, 0)
    const seconds = String(totalSeconds % 60).padStart(2, 0)

    return `${hours}:${minutes}:${seconds}`
  }

  setTime(time) {
    this.deltaTime = time
    this.time = this.convert()
    this.setText()
    this.prev = this.time
  }

  setText() {
    const p = this.prev.split(':')
    const t = this.time.split(':')

    t.forEach((el, j) => {

      if (el !== p[j]) {
        Array.from(el).map((v, i) => {
          if (v !== p[j][i]) {
            const above = this.dom[j][i].above
            const below = this.dom[j][i].below

            below.textContent = v

            above.classList.add(HIDE)
            below.classList.add(SHOW)

            setTimeout(() => {
              above.textContent = v
              above.classList.remove(HIDE)
              below.classList.remove(SHOW)
            }, 500)
          }
        })
      }
    })
  }
}
