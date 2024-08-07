import { Tween, Easing } from "../../utils/tween"
import { SHOW, HIDE, NONE, START } from "../../constants"

export default class UIController {

  get cursor() {
    return document.body.classList
  }

  constructor(world) {

    this.world = world

    this.tweens = {}
    this.durations = {
      cube: 1500,
      zoom: 1500,
      reset: 500,
      elevate: 1500,
      complete: 1500,
      stats: 1000,
      preferences: 1000,
      button: 500,
      title: 500,
      tick: 500
    }
    this.data = {
      cubeY: -0.2,
      cameraZoom: 0.85,
    }

    this.activeTransitions = 0

  }

  init() {

    this.world.controls.disable()

    this.world.cube.object.position.y = this.data.cubeY
    this.world.cube.animator.position.y = 4
    this.world.cube.animator.rotation.x = - Math.PI / 3
    this.world.camera.zoom = this.data.cameraZoom
    this.world.camera.updateProjectionMatrix()

    this.tweens.buttons = {}
    this.tweens.tick = []
    this.tweens.title = []
    this.tweens.best = []
    this.tweens.complete = []
    this.tweens.prefs = []
    this.tweens.theme = []
    this.tweens.stats = []

  }

  buttons(show, hide) {
    this.activeTransitions++

    if (hide.length) {
      hide.forEach(button => {
        button.classList.remove(SHOW)
        button.classList.add(HIDE)
      })
    }

    if (show.length) {
      setTimeout(() => show.forEach(button => {
        button.classList.add(SHOW)
        button.classList.remove(HIDE)
      }), this.durations.button)
    }

    setTimeout(() => this.activeTransitions--, this.durations.button)

  }

  cube(visible) {
    this.activeTransitions++

    try { this.tweens.cube.stop() } catch (e) { }

    const currentY = this.world.cube.animator.position.y
    const currentRotation = this.world.cube.animator.rotation.x
    const show = visible === SHOW

    this.tweens.cube = new Tween({
      duration: show ? 3000 : 1250,
      easing: show ? Easing.Elastic.Out(0.8, 0.6) : Easing.Back.In(1),
      onUpdate: tween => {

        this.world.cube.animator.position.y = show
          ? (1 - tween.value) * 4
          : currentY + tween.value * 4

        this.world.cube.animator.rotation.x = show
          ? (1 - tween.value) * Math.PI / 3
          : currentRotation + tween.value * - Math.PI / 3

      },
    })

    setTimeout(() => this.activeTransitions--, this.durations.cube)
  }

  reset() {
    if (this.tweens.reset) return

    this.activeTransitions++

    const target = this.world.cube.object
    const { x, y, z } = target.rotation

    this.tweens.reset = new Tween({
      target,
      duration: this.durations.reset,
      easing: Easing.Power.InOut(),
      onUpdate: ({ value }) => {
        target.rotation.set(x - x * value, y - y * value, z - z * value)
      },
      onComplete: () => {
        this.world.cube.reset()
        this.tweens.reset = null
      }
    })

    setTimeout(() => this.activeTransitions--, this.durations.reset)
  }

  float(play) {
    try { this.tweens.float.stop() } catch (e) { }

    if (play === START) {
      this.tweens.float = new Tween({
        duration: 1500,
        easing: Easing.Sine.InOut(),
        yoyo: true,
        onUpdate: tween => {
          this.world.cube.holder.position.y = tween.value * 0.1

          this.world.controls.cubeHelper.position.y = this.world.cube.holder.position.y + this.world.cube.object.position.y
        },
      })
    } else {
      new Tween({
        target: this.world.cube.holder.position,
        duration: 500,
        easing: Easing.Sine.Out(),
        to: { y: 0 },
        onUpdate: () => {
          this.world.controls.cubeHelper.position.y = this.world.cube.holder.position.y + this.world.cube.object.position.y
        },
      })
    }
  }

  zoom(play, time) {

    this.activeTransitions++

    const { camera } = this.world
    const zoom = (play) ? 1 : this.data.cameraZoom
    const duration = (time > 0) ? Math.max(time, 1500) : 1500
    const rotations = (time > 0) ? Math.round(duration / 1500) : 1
    const easing = Easing.Power.InOut((time > 0) ? 2 : 3)

    this.tweens.zoom = new Tween({
      target: camera,
      duration: duration,
      easing: easing,
      from: { zoom: camera.zoom },
      to: { zoom: zoom },
      onUpdate: () => { camera.updateProjectionMatrix() },
    })

    this.tweens.rotate = new Tween({
      target: this.world.cube.animator.rotation,
      duration: duration,
      easing: easing,
      to: { y: - Math.PI * 2 * rotations },
      onComplete: () => { this.world.cube.animator.rotation.y = 0 },
    })

    this.durations.zoom = duration

    setTimeout(() => this.activeTransitions--, this.durations.zoom)

  }

  elevate(play) {

    this.activeTransitions++

    this.tweens.elevate = new Tween({
      target: this.world.cube.object.position,
      duration: play ? 1500 : 0,
      easing: Easing.Power.InOut(3),
      to: { y: play ? -0.05 : this.data.cubeY }
    })

    setTimeout(() => this.activeTransitions--, this.durations.elevate)

  }

  complete(visible, best) {
    this.activeTransitions++

    const text = best ? this.world.dom.texts.best : this.world.dom.texts.complete

    if (visible === SHOW) {
      text.classList.add(SHOW)
      setTimeout(() => text.classList.remove(SHOW), this.durations.complete * 2)
    }

    setTimeout(() => this.activeTransitions--, this.durations.complete)
  }

  stats(visible) {
    this.activeTransitions++

    const stats = this.world.dom.stats
    if (visible === SHOW) {
      this.world.scores.calcStats()
      stats.classList.remove(HIDE, NONE)
      stats.classList.add(SHOW)
    } else {
      stats.classList.remove(SHOW)
      stats.classList.add(HIDE)
      setTimeout(() => stats.classList.add(NONE), this.durations.stats)
    }

    setTimeout(() => this.activeTransitions--, this.durations.stats)
  }

  preferences(visible) {
    this.activeTransitions++

    const prefs = this.world.dom.prefs
    if (visible === SHOW) {
      prefs.classList.remove(HIDE, NONE)
      prefs.classList.add(SHOW)
    } else {
      prefs.classList.remove(SHOW)
      prefs.classList.add(HIDE)
      setTimeout(() => prefs.classList.add(NONE), this.durations.preferences)
    }

    setTimeout(() => this.activeTransitions--, this.durations.preferences)
  }

  theming(visible) { }

  title(visible) {
    this.activeTransitions++

    const title = this.world.dom.texts.title
    const note = this.world.dom.texts.note

    if (visible === SHOW) {
      title.classList.remove(HIDE, NONE)
      note.classList.remove(HIDE, NONE)
      title.classList.add(SHOW)
      note.classList.add(SHOW)
    } else {
      note.style.opacity = window.getComputedStyle(note).opacity
      title.classList.remove(SHOW)
      note.classList.remove(SHOW)
      title.classList.add(HIDE)

      // transition 过渡动画需要等待 note.style.opacity 赋值在页面中生效
      setTimeout(() => note.classList.add(HIDE), null)
      setTimeout(() => { title.classList.add(NONE); note.classList.add(NONE) }, this.durations.title)
    }

    setTimeout(() => this.activeTransitions--, this.durations.title)

  }

  tick(visible) {

    this.activeTransitions++

    const tick = this.world.dom.texts.tick
    if (visible === SHOW) {
      tick.classList.remove(HIDE)
      tick.classList.add(SHOW)
    } else {
      tick.classList.remove(SHOW)
      tick.classList.add(HIDE)
    }

    const letters = tick.querySelectorAll('i')

    setTimeout(() => this.activeTransitions--, this.durations.tick)

  }
}