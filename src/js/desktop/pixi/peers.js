import { WIDTH, HEIGHT, FPS, AUDIO_EXP, logInfo } from "../../common"
import AppEmitter from "../../common/emitter"
import Gui from "../../common/gui"
import Socket from "../../socket"
import { sample } from "lodash"
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
    icon.beginFill(parseInt(`0x${fill.substring(1, fill.length)}`), 1)
    icon.drawCircle(i * 20, 20, 10)
    icon.endFill()
    gfxC.addChild(icon)
  }

  Gui.on("started", v => {
    Socket.socket.on("rooms:get", rooms => {
      clear()
      _rooms = rooms.filter(r => r !== state.room.id)

      _rooms.forEach((r, i) => drawRoom(r, i))

      renderer.render(gfxC)
    })

    Socket.socket.emit("rooms:get")
    logInfo("\tPeers listening for new rooms")
  })

  window.addEventListener("resize", () => {
    renderer.render(gfxC)
  })

  Gui.on("connect", v => {
    if (v) {
      Socket.socket.emit("rooms:get")
    }
  })

  return {}
}

export default Peers
