import { Mesh, MeshStandardMaterial, PlaneGeometry } from "three"
import lights_fragment_begin from 'three/src/renderers/shaders/ShaderChunk/lights_fragment_begin.glsl.js'

export default class Floor {
  constructor(world) {
    // const geometry = new CircleGeometry(2, 64)
    const geometry = new PlaneGeometry(8, 8, 1, 1)

    const material = new MeshStandardMaterial({
      color: 'white'
    })
    material.onBeforeCompile = (shader) => {
      // shader.vertexShader = `varying vec2 vUv;\n${shader.vertexShader}`.replace(
      //   '#include <color_vertex>',
      //   'vUv = uv;'
      // )
      // shader.fragmentShader = `varying vec2 vUv;\n${shader.fragmentShader}`.replace(
      //   '#include <color_fragment>',
      //   `
      //     float color = 1. - distance(vUv, vec2(.5)) * 2.;
      //     float strength = pow(distance(vUv, vec2(.5)) * 2., 2.) + .02;
      //     color = smoothstep(0., .25, color * strength);
      //     diffuseColor.rgb = vec3(color);
      //   `
      // )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_begin>',
        lights_fragment_begin.replace('getAmbientLightIrradiance( ambientLightColor )', 'vec3(0.0)')
      )
    }

    const floor = new Mesh(geometry, material)
    floor.receiveShadow = true
    floor.rotateX(-Math.PI * .5)
    floor.position.y = -1
    world.scene.add(floor)
  }
}