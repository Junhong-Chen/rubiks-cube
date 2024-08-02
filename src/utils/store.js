function deepAssign(target, source) {
  // 如果 source 不是对象，则直接返回 target
  if (typeof source !== 'object' || source === null) {
    return target
  }

  // 遍历 source 对象中的键
  for (const key in source) {
    // 确保该键是 source 自身的属性，而不是从原型链继承的
    if (source.hasOwnProperty(key)) {
      // 如果 source[key] 是对象且 target[key] 也是对象，则递归调用 deepAssign
      if (typeof source[key] === 'object' && source[key] !== null) {
        if (typeof target[key] !== 'object' || target[key] === null) {
          target[key] = Array.isArray(source[key]) ? [] : {}
        }
        deepAssign(target[key], source[key])
      } else {
        // 否则直接赋值
        target[key] = source[key]
      }
    }
  }

  return target
}

export const STATE_TYPE = {
  GAME: 'game',
  SCORES: 'scores',
  PREFERENCES: 'preferences'
}

export default class Store {
  #listeners = {
    [STATE_TYPE.GAME]: [],
    [STATE_TYPE.SCORES]: [],
    [STATE_TYPE.PREFERENCES]: []
  }

  constructor() {
    // 默认值
    this.state = {
      [STATE_TYPE.GAME]: {
        2: {
          time: null,
          cubeData: null
        },
        3: {
          time: null,
          cubeData: null
        },
        4: {
          time: null,
          cubeData: null
        },
        5: {
          time: null,
          cubeData: null
        }
      },
      [STATE_TYPE.SCORES]: {
        2: {
          scores: [],
          solves: 0,
          best: 0,
          worst: 0,
        },
        3: {
          scores: [],
          solves: 0,
          best: 0,
          worst: 0,
        },
        4: {
          scores: [],
          solves: 0,
          best: 0,
          worst: 0,
        },
        5: {
          scores: [],
          solves: 0,
          best: 0,
          worst: 0,
        }
      },
      [STATE_TYPE.PREFERENCES]: {
        cubeSize: 3,
        cameraFov: 30,
        controlsFlipConfig: 1,
        scramblerDificulty: 1,
        themesTheme: 'cube',
      }
    }

    this.load(STATE_TYPE.GAME)
    this.load(STATE_TYPE.SCORES)
    this.load(STATE_TYPE.PREFERENCES)
  }

  setState(type, state) {
    deepAssign(this.state[type], state)
    this.save(type)
    this.notify(type)
  }

  subscribe(type, listener) {
    return this.#listeners[type].push(listener)
  }

  unsubscribe(type, listener) {
    const i = this.#listeners[type].findIndex(l => l === listener)
    if (i > -1) {
      return this.#listeners[type].splice(i, 1)
    }
  }

  notify(type) {
    this.#listeners[type].forEach(listener => listener(this.state[type]))
  }

  load(type) {
    const data = JSON.parse(localStorage.getItem(type))

    if (data) {
      deepAssign(this.state[type], data)
    }
    this.save(type)
  }

  save(type) {
    localStorage.setItem(type, JSON.stringify(this.state[type]))
  }

  clear(type) {
    localStorage.removeItem(type)
  }
}