import { Vector3 } from "three"
import { SCRAMBLE_COUNT } from "../../constants"

const FACES = {
  SMALL: 'UDLRFB',
  LARGE: 'UuDdLlRrFfBb'
}

const modifiers = ["", "'", "2"] // 顺时针、逆时针、180°

export default class Scrambler {
  constructor(world) {
    this.world = world

    this.dificulty = 0

    this.conveted = []
  }

  scramble(scramble) {
    const moves = scramble !== undefined ? scramble.split(' ') : []
    const { size } = this.world.cube

    if (moves.length < 1) {
      const scrambleCount = SCRAMBLE_COUNT[size][this.dificulty]

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
    const axes = { U: 'y', D: 'y', L: 'x', R: 'x', F: 'z', B: 'z' }
    const rows = { U: 1, D: -1, L: -1, R: 1, F: 1, B: -1 }

    const axis = axes[face.toUpperCase()]
    let row = rows[face.toUpperCase()]

    if (this.world.cube.size > 3 && face !== face.toLowerCase()) row = row * 2

    const position = new Vector3()
    position[axes[face.toUpperCase()]] = row

    const angle = (Math.PI / 2) * - row * ((modifier === modifiers[1]) ? - 1 : 1)

    return { position, axis, angle, name: move }
  }
}