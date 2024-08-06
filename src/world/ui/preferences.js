import { CUBE_SIZES, SCRAMBLE_COUNT } from "../../constants"

const rangeHTML = `
<div class="range">
  <label></label>
  <input type="range" />
  <datalist></datalist>
</div>
`

let temp = document.createElement('div')
const inputs = {}

document.querySelectorAll('range-slider').forEach(el => {
  temp.innerHTML = rangeHTML

  const range = temp.querySelector('.range')
  const label = range.querySelector('label')
  const input = range.querySelector('input')
  const datalist = range.querySelector('datalist')

  const title = el.getAttribute('title')
  const name = el.getAttribute('name')
  const list = el.getAttribute('list').split(',')
  const dataType = el.getAttribute('data-type')
  const min = el.getAttribute('min') || 0
  const max = el.getAttribute('max') || list.length - 1

  label.textContent = title
  label.setAttribute('for', name)
  input.setAttribute('id', name)
  input.setAttribute('name', name)
  input.setAttribute('value', 0)
  input.setAttribute('min', min)
  input.setAttribute('max', max)

  list.forEach((value, i) => {
    const item = document.createElement('li')
    item.setAttribute('value', i)
    item.setAttribute('label', value)
    item.textContent = value

    item.classList.add(dataType)

    datalist.appendChild(item)
  })
  datalist.classList.add(`${name}-data-list`)

  inputs[name] = input
  el.parentNode.replaceChild(range, el)
})
temp = null

export default class Preferences {

  get value() {
    return {
      cubeSize: CUBE_SIZES[inputs.size.value],
      controlsRotationType: +inputs.rotation.value,
      controlsFlipType: +inputs.flip.value,
      scramblerDificulty: +inputs.scramble.value,
      cameraFov: +inputs.fov.value,
    }
  }

  constructor() { }

  init(preferences) {
    const { cubeSize, controlsRotationType, controlsFlipType, scramblerDificulty, cameraFov } = preferences

    inputs.size.value = CUBE_SIZES.findIndex(s => s === cubeSize)
    inputs.rotation.value = controlsRotationType
    inputs.flip.value = controlsFlipType
    inputs.scramble.value = scramblerDificulty
    inputs.fov.value = cameraFov

    const scrambleDataList = Array.from(document.body.querySelector('.scramble-data-list').children)
    inputs.size.addEventListener('change', e => {
      const size = CUBE_SIZES[e.target.value]
      scrambleDataList.forEach((el, i) => el.setAttribute('label', SCRAMBLE_COUNT[size][i])
      )
    })
  }
}
