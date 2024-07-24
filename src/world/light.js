import { AmbientLight, DirectionalLight, PointLight, DirectionalLightHelper, PointLightHelper, SpotLight } from "three"
import { Tween, Easing } from "../utils/tween.js"

const SwitchType = {
  TURNON: 1,
  TURNOFF: 0
}

export default class Light {
  #scene

  constructor(world) {
    this.#scene = world.scene
  
    this.aLight = this.addAmbientLight()
    this.pLight = this.addPointLight()

    this.switch(SwitchType.TURNON)
  }

  addAmbientLight() {
    const aLight = new AmbientLight('white', 0)
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
    new Tween({
      easing: Easing.Power.InOut(),
      duration: 500,
      onUpdate: tween => {
        switch(type) {
          case SwitchType.TURNON:
            this.aLight.intensity = tween.value * 3
            this.pLight.intensity = tween.value * 32
            this.pLight.angle = tween.value * Math.PI / 8
            break
          case SwitchType.TURNOFF:
            this.aLight.intensity = (1 - tween.value) * 3
            this.pLight.intensity = (1 - tween.value ) * 32
            this.pLight.angle = (1 - tween.value ) * Math.PI / 8
            break
        }
      },
      onComplete: () => {
      },
    })
  }
}