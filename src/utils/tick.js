import { Animation } from "../utils/animation.js"

export default class Tick extends Animation {

  constructor(world) {
    super(false)

    this.world = world

    this.reset()
  }

  start(continueGame) {
    this.startTime = continueGame ? (Date.now() - this.deltaTime) : Date.now()
    this.deltaTime = 0
    this.converted = this.convert()

    super.start()
  }

  reset() {
    this.startTime = 0
    this.currentTime = 0
    this.deltaTime = 0
    this.converted = '00:00'
  }

  stop() {
    this.currentTime = Date.now()
    this.deltaTime = this.currentTime - this.startTime
    this.convert()

    super.stop()

    return { time: this.converted, millis: this.deltaTime }
  }

  update() {
    const old = this.converted

    this.currentTime = Date.now()
    this.deltaTime = this.currentTime - this.startTime
    this.convert()

    if (this.converted != old) {
      localStorage.setItem('theCube_time', this.deltaTime)
      this.setText()
    }
  }

  convert() {
    const totalSeconds = Math.floor(this.deltaTime / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, 0)
    const seconds = String(totalSeconds % 60).padStart(2, 0)

    this.converted = `${hours > 0 ? hours + ':' : ''}${minutes}:${seconds}`
  }

  setText() {
    this.world.dom.texts.tick.innerHTML = this.converted
  }
}
