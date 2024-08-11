import { Mesh, MeshStandardMaterial, PlaneGeometry } from "three"
import lights_fragment_begin from "three/src/renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js"

export default class Floor {
  constructor(world) {
    const geometry = new PlaneGeometry(8, 8, 1, 1)

    const material = new MeshStandardMaterial({
      color: 'white'
    })
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_begin>',
        lights_fragment_begin.replace('getAmbientLightIrradiance( ambientLightColor )', 'vec3(0.0)')
      )
    }

    const floor = new Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotateX(-Math.PI * .5)
    floor.position.y = -1.5
    world.scene.add(floor)
  }
}