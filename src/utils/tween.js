import { Animation } from "./animation.js"

export const Easing = {
  Power: {
    In: power => {
      power = Math.round(power || 1)

      return t => Math.pow(t, power)
    },
    Out: power => {
      power = Math.round(power || 1)

      return t => 1 - Math.abs(Math.pow(t - 1, power))
    },
    InOut: power => {
      power = Math.round(power || 1)

      return t => (t < 0.5)
        ? Math.pow(t * 2, power) / 2
        : (1 - Math.abs(Math.pow((t * 2 - 1) - 1, power))) / 2 + 0.5
    },
  },

  Sine: {
    In: () => t => 1 + Math.sin(Math.PI / 2 * t - Math.PI / 2),

    Out: () => t => Math.sin(Math.PI / 2 * t),

    InOut: () => t => (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2,
  },

  Back: {
    Out: s => {
      s = s || 1.70158

      return t => { return (t -= 1) * t * ((s + 1) * t + s) + 1 }
    },

    In: s => {
      s = s || 1.70158

      return t => { return t * t * ((s + 1) * t - s) }
    }
  },

  Elastic: {
    Out: (amplitude, period) => {
      let PI2 = Math.PI * 2

      let p1 = (amplitude >= 1) ? amplitude : 1
      let p2 = (period || 0.3) / (amplitude < 1 ? amplitude : 1)
      let p3 = p2 / PI2 * (Math.asin(1 / p1) || 0)

      p2 = PI2 / p2

      return t => { return p1 * Math.pow(2, -10 * t) * Math.sin((t - p3) * p2) + 1 }
    },
  },
}

export class Tween extends Animation {

  constructor(options) {
    super(false)

    this.duration = options.duration || 500
    this.easing = options.easing || (t => t)
    this.onUpdate = options.onUpdate || (() => { })
    this.onComplete = options.onComplete || (() => { })

    this.delay = options.delay || false
    this.yoyo = options.yoyo ? false : null

    this.progress = 0
    this.value = 0
    this.delta = 0

    this.complete = false

    this.getFromTo(options)

    if (this.delay) setTimeout(() => super.start(), this.delay)
    else super.start()

    this.onUpdate(this)
  }

  update(delta) {
    const old = this.value
    const direction = (this.yoyo === true) ? - 1 : 1

    this.progress += (delta / this.duration) * direction

    if (this.yoyo === null && this.progress > 1) {
      this.progress = 1
      this.value = 1
      this.complete = true
    } else {
      this.value = this.easing(this.progress)
    }

    this.delta = this.value - old
    this.onUpdate(this)
    
    if (this.values !== null) this.updateFromTo()

    if (this.yoyo !== null) this.updateYoyo()

    if (this.complete) {
      this.onComplete(this)
      super.stop()
    }
  }

  updateYoyo() {
    if (this.progress > 1 || this.progress < 0) {

      this.value = this.progress = (this.progress > 1) ? 1 : 0
      this.yoyo = !this.yoyo

    }

    this.onUpdate(this)
  }

  updateFromTo() {
    this.values.forEach(key => {

      this.target[key] = this.from[key] + (this.to[key] - this.from[key]) * this.value

    })
  }

  getFromTo(options) {
    if (!options.target || !options.to) {
      this.values = null
      return
    }

    this.target = options.target || null
    this.from = options.from || {}
    this.to = options.to || null
    this.values = []

    if (Object.keys(this.from).length < 1)
      Object.keys(this.to).forEach(key => { this.from[key] = this.target[key] })

    Object.keys(this.to).forEach(key => { this.values.push(key) })
  }
}