import { Tween, Easing } from "../../utils/tween"
import { SHOW, HIDE, START } from "../../constants"

export default class UIController {

  get cursor() {
    return document.body.classList
  }

  constructor(world) {

    this.world = world

    this.tweens = {}
    this.durations = {}
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
    if (hide.length) {
      hide.forEach(button => {
        button.classList.remove(SHOW)
        setTimeout(() => button.classList.add(HIDE), null)
      })
    }

    if (show.length) {
      setTimeout(() => show.forEach(button => {
        button.classList.add(SHOW)
        button.classList.remove(HIDE)
      }), 500)
    }
  }

  cube(visible, theming = false) {

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
          ? (theming ? 0.9 + (1 - tween.value) * 3.5 : (1 - tween.value) * 4)
          : currentY + tween.value * 4

        this.world.cube.animator.rotation.x = show
          ? (1 - tween.value) * Math.PI / 3
          : currentRotation + tween.value * - Math.PI / 3

      },
    })

    if (theming) {

      if (show) {
        this.world.camera.zoom = 0.75
        this.world.camera.updateProjectionMatrix()
      } else {
        setTimeout(() => {
          this.world.camera.zoom = this.data.cameraZoom
          this.world.camera.updateProjectionMatrix()
        }, 1500)
      }

    }

    this.durations.cube = show ? 1500 : 1500

    setTimeout(() => this.activeTransitions--, this.durations.cube)

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

    this.durations.elevate = 1500

    setTimeout(() => this.activeTransitions--, this.durations.elevate)

  }

  complete(visible, best) {
    this.activeTransitions++

    const text = best ? this.world.dom.texts.best : this.world.dom.texts.complete
    const duration = 3000
    if (visible === SHOW) {
      text.classList.add(SHOW)
      setTimeout(() => text.classList.remove(SHOW), duration)
    }

    setTimeout(() => this.activeTransitions--, duration / 2)
  }

  stats(visible) {
    const show = visible === SHOW
    if (show) this.world.scores.calcStats()

    this.activeTransitions++

    this.tweens.stats.forEach(tween => { tween.stop(); tween = null })

    let tweenId = -1

    const stats = this.world.dom.stats.querySelectorAll('.stats-item')
    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3)

    stats.forEach((stat, index) => {

      const delay = index * (show ? 80 : 60)

      this.tweens.stats[tweenId++] = new Tween({
        delay: delay,
        duration: 400,
        easing: easing,
        onUpdate: tween => {

          const translate = show ? (1 - tween.value) * 2 : tween.value
          const opacity = show ? tween.value : (1 - tween.value)

          stat.style.transform = `translate3d(0, ${translate}em, 0)`
          stat.style.opacity = opacity

        }
      })

    })

    this.durations.stats = 0

    setTimeout(() => this.activeTransitions--, this.durations.stats)

  }

  preferences(visible) {

    this.ranges(this.world.dom.prefs.querySelectorAll('.range'), 'prefs', visible === SHOW)

  }

  theming(visible) {

    this.ranges(this.world.dom.theme.querySelectorAll('.range'), 'prefs', visible === SHOW)

  }

  ranges(ranges, type, show) {

    this.activeTransitions++

    this.tweens[type].forEach(tween => { tween.stop(); tween = null })

    const easing = show ? Easing.Power.Out(2) : Easing.Power.In(3)

    let tweenId = -1
    let listMax = 0

    ranges.forEach((range, rangeIndex) => {

      const label = range.querySelector('.range__label')
      const track = range.querySelector('.range__track-line')
      const handle = range.querySelector('.range__handle')
      const list = range.querySelectorAll('.range__list div')

      const delay = rangeIndex * (show ? 120 : 100)

      label.style.opacity = show ? 0 : 1
      track.style.opacity = show ? 0 : 1
      handle.style.opacity = show ? 0 : 1
      handle.style.pointerEvents = show ? 'all' : 'none'

      this.tweens[type][tweenId++] = new Tween({
        delay: show ? delay : delay,
        duration: 400,
        easing: easing,
        onUpdate: tween => {

          const translate = show ? (1 - tween.value) : tween.value
          const opacity = show ? tween.value : (1 - tween.value)

          label.style.transform = `translate3d(0, ${translate}em, 0)`
          label.style.opacity = opacity

        }
      })

      this.tweens[type][tweenId++] = new Tween({
        delay: show ? delay + 100 : delay,
        duration: 400,
        easing: easing,
        onUpdate: tween => {

          const translate = show ? (1 - tween.value) : tween.value
          const scale = show ? tween.value : (1 - tween.value)
          const opacity = scale

          track.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, 1, 1)`
          track.style.opacity = opacity

        }
      })

      this.tweens[type][tweenId++] = new Tween({
        delay: show ? delay + 100 : delay,
        duration: 400,
        easing: easing,
        onUpdate: tween => {

          const translate = show ? (1 - tween.value) : tween.value
          const opacity = 1 - translate
          const scale = 0.5 + opacity * 0.5

          handle.style.transform = `translate3d(0, ${translate}em, 0) scale3d(${scale}, ${scale}, ${scale})`
          handle.style.opacity = opacity

        }
      })

      list.forEach((listItem, labelIndex) => {

        listItem.style.opacity = show ? 0 : 1

        this.tweens[type][tweenId++] = new Tween({
          delay: show ? delay + 200 + labelIndex * 50 : delay,
          duration: 400,
          easing: easing,
          onUpdate: tween => {

            const translate = show ? (1 - tween.value) : tween.value
            const opacity = show ? tween.value : (1 - tween.value)

            listItem.style.transform = `translate3d(0, ${translate}em, 0)`
            listItem.style.opacity = opacity

          }
        })

      })

      listMax = list.length > listMax ? list.length - 1 : listMax

      range.style.opacity = 1

    })

    this.durations[type] = show
      ? ((ranges.length - 1) * 100) + 200 + listMax * 50 + 400
      : ((ranges.length - 1) * 100) + 400

    setTimeout(() => this.activeTransitions--, this.durations[type])

  }

  title(visible) {
    this.activeTransitions++

    const title = this.world.dom.texts.title
    const note = this.world.dom.texts.note

    if (visible === SHOW) {
      title.classList.remove(HIDE)
      note.classList.remove(HIDE)
      title.classList.add(SHOW)
      note.classList.add(SHOW)
    } else {
      title.classList.remove(SHOW)
      note.style.opacity = window.getComputedStyle(note).opacity
      note.classList.remove(SHOW)
      setTimeout(() => {
        title.classList.add(HIDE)
        note.classList.add(HIDE)
      }, null)
    }

    setTimeout(() => this.activeTransitions--, this.durations.title)

  }

  tick(visible) {

    this.activeTransitions++

    const tick = this.world.dom.texts.tick

    tick.style.opacity = 0
    this.world.tick.convert()
    this.world.tick.setText()

    this.splitLetters(tick)
    const letters = tick.querySelectorAll('i')
    this.flipLetters('tick', letters, visible === SHOW)

    tick.style.opacity = 1

    setTimeout(() => this.activeTransitions--, this.durations.tick)

  }

  splitLetters(element) {

    const text = element.innerHTML

    element.innerHTML = ''

    text.split('').forEach(letter => {

      const i = document.createElement('i')

      i.innerHTML = letter

      element.appendChild(i)

    })

  }

  flipLetters(type, letters, show) {

    try { this.tweens[type].forEach(tween => tween.stop()) } catch (e) { }

    letters.forEach((letter, index) => {

      letter.style.opacity = show ? 0 : 1

      this.tweens[type][index] = new Tween({
        easing: Easing.Sine.Out(),
        duration: show ? 800 : 400,
        delay: index * 50,
        onUpdate: tween => {

          const rotation = show ? (1 - tween.value) * -80 : tween.value * 80

          letter.style.transform = `rotate3d(0, 1, 0, ${rotation}deg)`
          letter.style.opacity = show ? tween.value : (1 - tween.value)

        },
      })

    })

    this.durations[type] = (letters.length - 1) * 50 + (show ? 800 : 400)

  }
}