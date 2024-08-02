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
    this.converted

    this.reset()
  }

  reset() {
    this.startTime = 0
    this.currentTime = 0
    this.deltaTime = 0
    this.converted = '00:00'
  }

  start(continueGame) {
    if (!this.ticking) {
      this.ticking = true
      this.startTime = continueGame ? (Date.now() - this.deltaTime) : Date.now()
      this.deltaTime = 0
      this.converted = this.convert()
  
      super.start()
    }
  }

  stop() {
    if (this.ticking) {
      this.ticking = false
      this.currentTime = Date.now()
      this.deltaTime = this.currentTime - this.startTime
      this.convert()
  
      super.stop()
    }
  }

  update() {
    const old = this.converted

    this.currentTime = Date.now()
    this.deltaTime = this.currentTime - this.startTime
    this.convert()

    if (this.converted !== old) {
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
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, 0)
    const seconds = String(totalSeconds % 60).padStart(2, 0)

    this.converted = `${hours > 0 ? hours + ':' : ''}${minutes}:${seconds}`
  }

  setText() {
    this.world.dom.texts.tick.innerHTML = this.converted
  }
}
