export default class Themes {

  get colors() {
    return this.themes[this.theme]
  }

  constructor() {
    this.theme = 'cube'
    this.themes = {
      cube: {
        U: 0xfff7ff, // white
        D: 0xffef48, // yellow
        F: 0xef3923, // red
        R: 0x41aac8, // blue
        B: 0xff8c0a, // orange
        L: 0x82ca38, // green
        P: 0x08101a, // piece
        G: 0xd1d5db, // background
      },
      erno: {
        U: 0xffffff,
        D: 0xffd500,
        F: 0xc41e3a,
        R: 0x0051ba,
        B: 0xff5800,
        L: 0x009e60,
        P: 0x08101a,
        G: 0x8abdff,
      },
      dust: {
        U: 0xfff6eb,
        D: 0xe7c48d,
        F: 0x8f253e,
        R: 0x607e69,
        B: 0xbe6f62,
        L: 0x849f5d,
        P: 0x08101a,
        G: 0xE7C48D,
      },
      camo: {
        U: 0xfff6eb,
        D: 0xbfb672,
        F: 0x37241c,
        R: 0x718456,
        B: 0x805831,
        L: 0x37431d,
        P: 0x08101a,
        G: 0xBFB672,
      },
      rain: {
        U: 0xfafaff,
        D: 0xedb92d,
        F: 0xce2135,
        R: 0x449a89,
        B: 0xec582f,
        L: 0xa3a947,
        P: 0x08101a,
        G: 0x87b9ac,
      },
    }
  }

  setTheme(theme) {
    this.theme = theme
  }
}