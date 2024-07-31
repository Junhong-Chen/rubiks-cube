import { Vector3 } from "three"

const FACES = {
  SMALL: 'UDLRFB',
  LARGE: 'UuDdLlRrFfBb'
}

const modifiers = ["", "'", "2"] // 顺时针、逆时针、180°

export default class Scrambler {
  constructor(world) {
    this.world = world

    this.dificulty = 0

    this.scrambleCount = {
      2: [7, 9, 11],
      3: [2, 25, 30],
      4: [30, 40, 50],
      5: [40, 60, 80],
    }

    this.conveted = []
  }

  scramble(scramble) {
    const moves = scramble !== undefined ? scramble.split(' ') : []
    const { size } = this.world.cube

    if (moves.length < 1) {
      const scrambleCount = this.scrambleCount[size][this.dificulty]

      const faces = size < 4 ? FACES.SMALL : FACES.LARGE
      const total = scramble === undefined ? scrambleCount : scramble

      let count = 0
      while (count < total) {
        const move = faces[Math.floor(Math.random() * faces.length)] + modifiers[Math.floor(Math.random() * 3)]

        if (count > 0 && move[0] === moves[count - 1][0]) continue
        if (count > 1 && move[0] === moves[count - 2][0]) continue

        moves.push(move)
        count++
      }
    }

    this.callback = () => {}
    this.convert(moves)

    return this
  }

  convert(moves) {
    this.converted = []

    moves.forEach(move => {
      const convertedMove = this.convertMove(move)
      const [_, modifier] = move

      this.converted.push(convertedMove)
      if (modifier === modifiers[2]) this.converted.push(convertedMove)
    })
  }

  convertMove(move) {
    const [face, modifier] = move
    const axes = { D: 'y', U: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }
    const rows = { D: -1, U: 1, L: -1, R: 1, F: 1, B: -1 }

    const axis = axes[face.toUpperCase()]
    let row = rows[face.toUpperCase()]

    if (this.world.cube.size > 3 && face !== face.toLowerCase()) row = row * 2

    const position = new Vector3()
    position[axes[face.toUpperCase()]] = row

    const angle = (Math.PI / 2) * - row * ((modifier === modifiers[1]) ? - 1 : 1)

    return { position, axis, angle, name: move }
  }
}