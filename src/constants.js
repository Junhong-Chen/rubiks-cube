// 魔方预设值
export const CUBE_PRESET = {
  checkerboard: {
    size: 3,
    indices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    positions: [
      { "x": 1/3, "y": -1/3, "z": 1/3 },
      { "x": -1/3, "y": 1/3, "z": 0 },
      { "x": 1/3, "y": -1/3, "z": -1/3 },
      { "x": -1/3, "y": 0, "z": -1/3 },
      { "x": 1/3, "y": 0, "z": 0 },
      { "x": -1/3, "y": 0, "z": 1/3 },
      { "x": 1/3, "y": 1/3, "z": 1/3 },
      { "x": -1/3, "y": -1/3, "z": 0 },
      { "x": 1/3, "y": 1/3, "z": -1/3 },
      { "x": 0, "y": 1/3, "z": -1/3 },
      { "x": 0, "y": -1/3, "z": 0 },
      { "x": 0, "y": 1/3, "z": 1/3 },
      { "x": 0, "y": 0, "z": 1/3 },
      { "x": 0, "y": 0, "z": 0 },
      { "x": 0, "y": 0, "z": -1/3 },
      { "x": 0, "y": -1/3, "z": -1/3 },
      { "x": 0, "y": 1/3, "z": 0 },
      { "x": 0, "y": -1/3, "z": 1/3 },
      { "x": -1/3, "y": -1/3, "z": 1/3 },
      { "x": 1/3, "y": 1/3, "z": 0 },
      { "x": -1/3, "y": -1/3, "z": -1/3 },
      { "x": 1/3, "y": 0, "z": -1/3 },
      { "x": -1/3, "y": 0, "z": 0 },
      { "x": 1/3, "y": 0, "z": 1/3 },
      { "x": -1/3, "y": 1/3, "z": 1/3 },
      { "x": 1/3, "y": -1/3, "z": 0 },
      { "x": -1/3, "y": 1/3, "z": -1/3 }
    ],
    rotations: [
      { "x": -Math.PI, "y": 0, "z": Math.PI, },
      { "x": Math.PI, "y": 0, "z": 0 },
      { "x": -Math.PI, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": 0 },
      { "x": 0, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": 0 },
      { "x": -Math.PI, "y": 0, "z": Math.PI },
      { "x": Math.PI, "y": 0, "z": 0 },
      { "x": -Math.PI, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": 0 },
      { "x": 0, "y": 0, "z": Math.PI },
      { "x": -Math.PI, "y": 0, "z": 0 },
      { "x": Math.PI, "y": 0, "z": Math.PI },
      { "x": Math.PI, "y": 0, "z": 0 },
      { "x": 0, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": 0 },
      { "x": 0, "y": 0, "z": Math.PI },
      { "x": Math.PI, "y": 0, "z": Math.PI },
      { "x": -Math.PI, "y": 0, "z": 0 },
      { "x": Math.PI, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": 0 },
      { "x": 0, "y": 0, "z": Math.PI },
      { "x": 0, "y": 0, "z": 0 },
      { "x": Math.PI, "y": 0, "z": Math.PI },
      { "x": -Math.PI, "y": 0, "z": 0 },
      { "x": Math.PI, "y": 0, "z": Math.PI }
    ],
  },
}

// 魔方六个面的方位
export const CUBE_DIRECTION = ['L', 'R', 'D', 'U', 'B', 'F']

export const CUBE_SIZES = [2, 3, 4, 5]

export const SCRAMBLE_COUNT = {
  2: [7, 13, 17],
  3: [20, 25, 30],
  4: [30, 40, 50],
  5: [40, 60, 80],
}

export const SHOW = 'show'
export const HIDE = 'hide'
export const NONE = 'none'

export const START = true
export const STOP = false

export const ROTATION_TYPE = {
  FREE: 0,
  FIXED: 1
}

export const FLIP_TYPE = {
  SWIFT: 0,
  SMOOTH: 1,
  BOUNCE: 2
}

