import { Vector2 } from "three"

export default class Draggable {

  constructor(element, options = {}) {

    this.position = {
      current: new Vector2(),
      start: new Vector2(),
      delta: new Vector2(),
      old: new Vector2(),
      drag: new Vector2(),
    }

    this.options = Object.assign({
      calcDelta: false,
      allowTouchmoveElement: null, // 用于指定允许 touchmove 的元素
    }, options)

    this.element = element

    this.drag = {
      start: (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return

        this.getPositionCurrent(event)

        if (this.options.calcDelta) {
          this.position.start = this.position.current.clone()
          this.position.delta.set(0, 0)
          this.position.drag.set(0, 0)
        }

        this.onDragStart(this.position)

        window.addEventListener('pointermove', this.drag.move, false)
        window.addEventListener('pointerup', this.drag.end, false)
        window.addEventListener('pointercancel', this.drag.end, false)
      },

      move: (event) => {
        if (this.options.calcDelta) {
          this.position.old = this.position.current.clone()
        }

        this.getPositionCurrent(event)

        if (this.options.calcDelta) {
          this.position.delta = this.position.current.clone().sub(this.position.old)
          this.position.drag = this.position.current.clone().sub(this.position.start)
        }
        
        this.onDragMove(this.position)
      },

      end: (event) => {
        this.getPositionCurrent(event)

        this.onDragEnd(this.position)

        window.removeEventListener('pointermove', this.drag.move, false)
        window.removeEventListener('pointerup', this.drag.end, false)
        window.removeEventListener('pointercancel', this.drag.end, false)
      },
    }

    this.onDragStart = () => { }
    this.onDragMove = () => { }
    this.onDragEnd = () => { }

    this.enable()

    // 全局 touchmove 事件处理程序
    document.addEventListener('touchmove', event => {
      if (this.options.allowTouchmoveElement && 
          this.options.allowTouchmoveElement.contains(event.target)) {
        return; // 允许特定元素内的 touchmove 事件
      }
      event.preventDefault();
    }, { passive: false });

    return this
  }

  enable() {
    this.element.addEventListener('pointerdown', this.drag.start, false)

    return this
  }

  disable() {
    this.element.removeEventListener('pointerdown', this.drag.start, false)

    return this
  }

  getPositionCurrent(event) {
    this.position.current.set(event.pageX, event.pageY)
    this.convertPosition(this.position.current)
  }

  // 坐标标准化
  convertPosition(position) {
    position.x = (position.x / this.element.offsetWidth) * 2 - 1
    position.y = - ((position.y / this.element.offsetHeight) * 2 - 1)

    return position
  }
}
