export default class Storage {
  constructor(world) {
    this.world = world

    const userVersion = localStorage.getItem('theCube_version')

    if (!userVersion || userVersion !== window.gameVersion) {

      this.clearGame()
      this.clearPreferences()
      this.migrateScores()
      localStorage.setItem('theCube_version', window.gameVersion)

    }
  }

  init() {
    this.loadPreferences()
    this.loadScores()
  }

  loadGame() {
    try {
      const gameInProgress = localStorage.getItem('theCube_playing') === 'true'

      if (!gameInProgress) throw new Error()

      const gameCubeData = JSON.parse(localStorage.getItem('theCube_savedState'))
      const gameTime = parseInt(localStorage.getItem('theCube_time'))

      if (!gameCubeData || gameTime === null) throw new Error()
      if (gameCubeData.size !== this.world.cube.sizeGenerated) throw new Error()

      this.world.cube.loadFromData(gameCubeData)

      this.world.timer.deltaTime = gameTime

      this.world.saved = true
    } catch (e) {
      this.world.saved = false
    }
  }

  saveGame() {
    const gameInProgress = true
    const gameCubeData = { names: [], positions: [], rotations: [] }
    const gameTime = this.world.tick.delta

    gameCubeData.size = this.world.cube.sizeGenerated

    this.world.cube.pieces.forEach(piece => {
      gameCubeData.names.push(piece.name)
      gameCubeData.positions.push(piece.position)
      gameCubeData.rotations.push(piece.rotation.toArray())
    })

    localStorage.setItem('theCube_playing', gameInProgress)
    localStorage.setItem('theCube_savedState', JSON.stringify(gameCubeData))
    localStorage.setItem('theCube_time', gameTime)
  }

  clearGame() {
    localStorage.removeItem('theCube_playing')
    localStorage.removeItem('theCube_savedState')
    localStorage.removeItem('theCube_time')
  }

  loadScores() {
    try {
      const scoresData = JSON.parse(localStorage.getItem('theCube_scores'))

      if (!scoresData) throw new Error()

      this.world.scores.data = scoresData

    } catch (e) { }
  }

  saveScores() {
    const scoresData = this.world.scores.data

    localStorage.setItem('theCube_scores', JSON.stringify(scoresData))
  }

  clearScores() {
    localStorage.removeItem('theCube_scores')
  }

  migrateScores() {

    try {
      const scoresData = JSON.parse(localStorage.getItem('theCube_scoresData'))
      const scoresBest = parseInt(localStorage.getItem('theCube_scoresBest'))
      const scoresWorst = parseInt(localStorage.getItem('theCube_scoresWorst'))
      const scoresSolves = parseInt(localStorage.getItem('theCube_scoresSolves'))

      if (!scoresData || !scoresBest || !scoresSolves || !scoresWorst) return false

      this.world.scores.data[3].scores = scoresData
      this.world.scores.data[3].best = scoresBest
      this.world.scores.data[3].solves = scoresSolves
      this.world.scores.data[3].worst = scoresWorst

      localStorage.removeItem('theCube_scoresData')
      localStorage.removeItem('theCube_scoresBest')
      localStorage.removeItem('theCube_scoresWorst')
      localStorage.removeItem('theCube_scoresSolves')
    } catch (e) { }
  }

  loadPreferences() {
    try {
      const preferences = JSON.parse(localStorage.getItem('theCube_preferences'))

      if (!preferences) throw new Error()
      this.world.cube.size = parseInt(preferences.cubeSize)
      // this.world.controls.flipConfig = parseInt(preferences.flipConfig)
      // this.world.scrambler.dificulty = parseInt(preferences.dificulty)

      // this.world.fov = parseFloat(preferences.fov)
      // this.world.resize()

      this.world.themes.colors = preferences.colors
      this.world.themes.setTheme(preferences.theme)

      return true
    } catch (e) {
      this.world.cube.size = 3
      // this.world.controls.flipConfig = 0
      // this.world.scrambler.dificulty = 1

      // this.world.fov = 10
      // this.world.resize()

      this.world.themes.setTheme('cube')

      this.savePreferences()

      return false
    }
  }

  savePreferences() {
    const preferences = {
      cubeSize: this.world.cube.size,
      // flipConfig: this.world.controls.flipConfig,
      // dificulty: this.world.scrambler.dificulty,
      // fov: this.world.fov,
      theme: this.world.themes.theme,
      colors: this.world.themes.colors,
    }

    localStorage.setItem('theCube_preferences', JSON.stringify(preferences))
  }

  clearPreferences() {
    localStorage.removeItem('theCube_preferences')
  }
}