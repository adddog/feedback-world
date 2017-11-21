import { WIDTH, HEIGHT, FPS, AUDIO_EXP, logInfo } from "common/constants"
import AppEmitter from "common/emitter"
import Gui from "common/gui"
import Socket from "common/socket"
import { sample } from "lodash"
import Color from "color"
import colors from "nice-color-palettes"

const Peers = (state, emitter, pixi) => {
  const { stage, renderer } = pixi

  const gfxC = new PIXI.Container()
  stage.addChild(gfxC)

  let _rooms

  const clear = () => {
    while (gfxC.children.length) {
      gfxC.removeChildAt(0)
    }
  }

  const drawRoom = (roomId, i) => {
    //const cc = Color(`0x${sample(colors)}`)
    const c = sample(colors)
    const icon = new PIXI.Graphics()
    icon.interactive = true
    icon.userData = {
      roomId,
    }

    icon.on("click", () => {
      clear()
      console.log("click", icon.userData)
      AppEmitter.emit("changerooms", icon.userData)
    })

    const fill = sample(c)
    console.log(fill)
    icon.beginFill(parseInt(`0x${fill.substring(1, fill.length)}`), 1)
    icon.drawCircle(
      window.innerWidth - (i+1) * 20,
      window.innerHeight - 20,
      10
    )
    icon.endFill()
    gfxC.addChild(icon)
  }


  return {}
}

export default Peers
