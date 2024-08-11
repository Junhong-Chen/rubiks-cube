import EventEmitter from "./eventEmitter"

export default class Sizes extends EventEmitter {
  #width
  #height
  #pixelRatio

  get width() {
    return this.#width
  }
  get height() {
    return this.#height
  }
  get pixelRatio() {
    return this.#pixelRatio
  }
  
  get aspect() {
    return this.#width / this.#height
  }

  constructor() {
    super()

    this.updateSize()

    this.resize = this.resize.bind(this)
    window.addEventListener('resize', this.resize, false)
  }

  updateSize() {
    this.#width = window.innerWidth
    this.#height = window.innerHeight
    this.#pixelRatio = Math.min(window.devicePixelRatio, 2)
  }

  resize() {
    this.updateSize()
    this.emit('resize')
  }

  destroy() {
    window.removeEventListener('resize', this.resize, false)
  }
}