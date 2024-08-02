import { STATE_TYPE } from "../../utils/store"

export default class Scores {

  constructor(world) {
    this.world = world

    this.data = null
  }

  addScore(time) {

    const data = this.data[this.world.cube.size]

    data.scores.push(time)
    data.solves++

    if (data.scores.lenght > 100) data.scores.shift()

    let bestTime = false

    if (time < data.best || data.best === 0) {

      data.best = time
      bestTime = true

    }

    if (time > data.worst) data.worst = time

    this.world.store.setState(STATE_TYPE.SCORES, {
      [this.world.cube.size]: data
    })

    return bestTime

  }

  calcStats() {

    const s = this.world.cube.size
    const data = this.data[s]
    const totalTime = this.getTotalTime(data)

    this.setStats('cube-size', `${s}<i>x</i>${s}<i>x</i>${s}`)
    this.setStats('total-solves', data.solves)
    this.setStats('game-time', this.convertTime(totalTime))
    this.setStats('best-time', this.convertTime(data.best))
    this.setStats('worst-time', this.convertTime(data.worst))
    this.setStats('average-time', this.convertTime(totalTime / data.scores.length))

  }

  setStats(name, value) {

    if (value === 0) value = '-'

    this.world.dom.stats.querySelector(`.stats-item[name="${name}"] b`).innerHTML = value

  }

  getTotalTime(data) {
    return data.scores.reduce((a, b) => a + b, 0)
  }

  convertTime(time) {
    const totalSeconds = Math.floor(time / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, 0)
    const seconds = String(totalSeconds % 60).padStart(2, 0)

    return `${hours > 0 ? hours + ':' : ''}${minutes}:${seconds}`
  }
}
