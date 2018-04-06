import { throttle, mean, random } from "lodash"
import Socket from "common/socket"
import Gui from "common/gui"
import AppEmitter from "common/emitter"
import { logInfo, IS_DEV, WIDTH, HEIGHT } from "common/constants"

const Footer = footerEl => {
  let _rooms

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

  Socket.socket.on("rooms:get", rooms => {
    _rooms = rooms.filter(r => r !== Gui.state.room.id).splice(0, 4)
    console.log(`Rooms to join`, _rooms)
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

  let _recordingFinal = false
  const microEl = footerEl.querySelector(".ui-record--micro")
  const frameEl = footerEl.querySelector(".ui-record--frame")
  const renderEl = footerEl.querySelector(".ui-record--render")

  frameEl.addEventListener("click", () => {
    if (!Gui.recording) {
      AppEmitter.emit("record:frame:start")
      frameEl.classList.add("active")
    } else {
      AppEmitter.emit("record:frame:stop")
      frameEl.classList.remove("active")
    }
    Gui.recording = !Gui.recording
  })

  renderEl.addEventListener("click", () => {
    if (!_recordingFinal) {
      _recordingFinal = true
      renderEl.classList.add("active")
      AppEmitter.emit("record:final:start")
    } else {
      renderEl.classList.remove("active")
      AppEmitter.emit("record:final:stop")
      _recordingFinal = false
    }
  })

  Gui.on(
    "recordSamples",
    v =>
      v === 1
        ? (() => {
            renderEl.classList.remove("hide")
            renderEl.classList.add("bounceIn")
          })()
        : null
  )
}

export default Footer
