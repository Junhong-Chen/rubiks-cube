import GUI from 'lil-gui'

export default class Debugger {
  #gui = null

  get gui() {
    return this.#gui
  }

  constructor() {
    this.init()
  }

  init() {
    this.hashChange() // first loaded
    window.addEventListener('hashchange', this.hashChange, false)
  }

  hashChange = () => {
    if (location.hash.includes('debug')) {
      this.#gui = new GUI()
    } else if (this.#gui) {
      this.#gui.destroy()
      this.#gui = null
    }
  }

  destroy() {
    window.removeEventListener('hashchange', this.hashChange, false)
    if (this.#gui) {
      this.#gui.destroy()
      this.#gui = null
    }
  }
}