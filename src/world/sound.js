export default class Sound {
  #enabled = false

  constructor() {
    this.popSound = new Audio(`/${import.meta.env.VITE_BASE_PATH}/sounds/pop.mp3`)
    this.fanfareSound = new Audio(`/${import.meta.env.VITE_BASE_PATH}/sounds/fanfare.mp3`)
    this.popSound.preload = 'auto' // 预加载
    this.fanfareSound.preload = 'auto'
  }

  enable() {
    if (!this.#enabled) {
      // this.popSound.volume = 0
      // this.popSound.play().then(() => {
      //   this.popSound.pause()
      //   this.popSound.currentTime = 0
      //   this.popSound.volume = 1
      //   this.#enabled = true
      // })

      this.fanfareSound.volume = 0
      this.fanfareSound.play().then(() => {
        this.fanfareSound.pause()
        this.fanfareSound.currentTime = 0
        this.fanfareSound.volume = 1
        this.#enabled = true
      })
    }
  }

  pop() {
    this.popSound.currentTime = 0 // 重置
    this.popSound.play()
  }

  fanfare() {
    this.fanfareSound.currentTime = 0 // 重置
    this.fanfareSound.play()
  }
}