import { throttle, mean, random } from "lodash"
import Socket from "../../socket"
import Gui from "../../common/gui"
import AppEmitter from "../../common/emitter"
import { logInfo, IS_DEV, WIDTH, HEIGHT, IS_DESKTOP } from "../../common"

import Header from './header'

const UI = () => {
  const footerEl = document.querySelector(".ui-footer")
  const headerEl = document.querySelector(".ui-header")

  if(IS_DESKTOP){
    const header = Header(headerEl)
  }

  const roomEls = document
    .querySelector(".ui-rooms")
    .querySelectorAll(".ui-room span")
  roomEls.forEach((el, i) =>
    el.parentNode.addEventListener(
      "click",
      () =>
        _rooms[i]
          ? AppEmitter.emit("changerooms", { roomId: _rooms[i] })
          : null
    )
  )

  const hide = el => el.classList.add("hide")
  const show = el => el.classList.remove("hide")

  AppEmitter.on("mousemove", e => {
    hide(footerEl)
    hide(headerEl)
    if (e.y > window.innerHeight - 40) {
      show(footerEl)
    } else if (e.y < 60) {
      show(headerEl)
    }
  })

  let _rooms

  Gui.on("started", v => {
    Socket.socket.on("rooms:get", rooms => {
      _rooms = rooms.filter(r => r !== Gui.state.room.id).splice(0, 4)
      roomEls.forEach(el => el.parentNode.classList.add("hide"))
      _rooms.forEach((r, i) => {
        roomEls[i].innerHTML = r
        roomEls[i].parentNode.classList.remove("hide")
        roomEls[i].parentNode.style.filter = `hue-rotate(${random(
          360
        )}deg)`
      })
    })

    Socket.socket.emit("rooms:get")
    logInfo("\tPeers listening for new rooms")
  })

  Gui.on("connect", v => {
    if (v) {
      Socket.socket.emit("rooms:get")
    }
  })

  setTimeout(() => {
    hide(footerEl)
    hide(headerEl)
  }, 2000)
}

export default UI
