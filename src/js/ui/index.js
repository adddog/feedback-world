import { throttle, mean, random } from "lodash"
import Pixi from "./pixi"
import Socket from "../socket"
import Gui from "../common/gui"
import AppEmitter from "../common/emitter"
import { logInfo, IS_DEV, WIDTH, HEIGHT, IS_DESKTOP } from "../common"

import Header from "./header"
import Footer from "./footer"

const UI = (state, emitter) => {
  function init() {
    const footerEl = document.querySelector(".ui-footer")
    const headerEl = document.querySelector(".ui-header")
    const pixi = Pixi(state, emitter, document.getElementById("pixi"))

    if (IS_DESKTOP) {
      const header = Header(headerEl)
      const footer = Footer(footerEl)
    }


    const hide = el => el.classList.add("hide")
    const show = el => el.classList.remove("hide")

    AppEmitter.on("mousemove", e => {
      hide(footerEl)
      hide(headerEl)
      if (e.y > window.innerHeight - 100) {
        show(footerEl)
      } else if (e.y < 60) {
        show(headerEl)
      }
    })

    setTimeout(() => {
      hide(footerEl)
      hide(headerEl)
    }, 2000)
  }
  return {
    init,
  }
}

export default UI
