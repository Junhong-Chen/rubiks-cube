export function random (min, max) {
  return min + Math.random() * (max - min)
}

export function remap(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1)
}

export function isWebGL2Supported() {
  try {
    const canvas = document.createElement('canvas')
    return !!window.WebGL2RenderingContext && !!canvas.getContext('webgl2')
  } catch (e) {
    return false
  }
}