import { AmbientLight, DirectionalLight, PointLight, DirectionalLightHelper, PointLightHelper, SpotLight } from "three"
import { Tween, Easing } from "../utils/tween.js"

export default class Light {
  static SWITCH = {
    TURNON: true,
    TURNOFF: false
  }

  #scene

  constructor(world) {
    this.#scene = world.scene
  
    this.aLight = this.addAmbientLight()
    this.pLight = this.addPointLight()
  }

  addAmbientLight() {
    const aLight = new AmbientLight('white', 4)
    this.#scene.add(aLight)
    return aLight
  }

  addPointLight() {
    const pLight = new SpotLight('white', 0, 0, 0)
    pLight.position.set(0, 4, 0)
    pLight.penumbra = 0.5
    pLight.castShadow = true
    pLight.shadow.camera.far = 8
    pLight.shadow.mapSize.set(256, 256)
    pLight.shadow.normalBias = 0.05

    this.#scene.add(pLight)

    return pLight
  }

  turnOn() {

  }

  turnOff() {

  }

  switch(type) {
    const easing = Easing.Power.InOut()
    const duration = 500
    
    switch(type) {
      case Light.SWITCH.TURNON:
        new Tween({
          easing,
          duration,
          onUpdate: tween => {
            this.pLight.intensity = tween.value * 32
            this.pLight.angle = tween.value * Math.PI / 8
          }
        })
        break
      case Light.SWITCH.TURNOFF:
        new Tween({
          easing,
          duration,
          onUpdate: tween => {
            this.pLight.intensity = (1 - tween.value ) * 32
            this.pLight.angle = (1 - tween.value ) * Math.PI / 8
          }
        })
        break
    }
  }
}