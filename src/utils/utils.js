export function isWebGL2Supported() {
  try {
    const canvas = document.createElement('canvas')
    return !!window.WebGL2RenderingContext && !!canvas.getContext('webgl2')
  } catch (e) {
    return false
  }
}