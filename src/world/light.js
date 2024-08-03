import { AmbientLight, SpotLight } from "three"
import { Tween, Easing } from "../utils/tween.js"

export default class Light {
  static SWITCH = {
    TURNON: true,
    TURNOFF: false
  }

  constructor(world) {
    this.type = Light.SWITCH.TURNOFF

    this.aLight = this.addAmbientLight()
    this.pLight = this.addPointLight()
    world.scene.add(this.aLight)
    world.scene.add(this.pLight)
  }

  addAmbientLight() {
    const aLight = new AmbientLight('white', 4)
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

    return pLight
  }

  switch(type, duration = 750) {
    if (type === this.type) return
    this.type = type
    const easing = type === Light.SWITCH.TURNON ? Easing.Power.In() : Easing.Power.Out()

    switch (type) {
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
          delay: 200,
          duration: duration - 200,
          onUpdate: tween => {
            this.pLight.intensity = (1 - tween.value) * 32
            this.pLight.angle = (1 - tween.value) * Math.PI / 8
          }
        })
        break
    }
  }
}