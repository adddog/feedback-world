import html from "choo/html"
import Component from "../common/component"
import HomeRegl from "./home-regl"
import { IS_DESKTOP, WIDTH, HEIGHT } from "../common"
var bel = require("bel")

module.exports = ({ store }, emit) => {
  emit("log:debug", "Rendering home view")

  console.log(store.room)

  if (store.room.created) return null

  const createRoomInput = e => {
    var value = e.target.value
    if (!value) return
    if (e.keyCode === 13) {
      emit("room:create", value)
    } else {
      emit("room:create:input", value)
    }
  }

  const joinRoom = () => {
    emit("room:create", store.room.id)
  }

  const createRoom = e => {
    emit("room:create", store.randomRoomId)
  }

  const changeCheckbox = e => {
    emit("state:usewebcam", e.target.checked)
  }

  const tree = new Component()
  const inputs = new Component()

  const inputHTML = () => html`
  <div>
    <input
        value=${store.room.id}
        autofocus
        onkeyup=${createRoomInput}
        placeholder="room name"/>
        <button class="ui-button" onclick=${joinRoom}>
        join ${store.room.id}
      </button>
      <div><span>use webcam</span><input label="use webcam" checked=${store.useWebcam
        ? "checked"
        : "false"}  type="checkbox" onchange=${changeCheckbox}></div>
      <h1>join new room ${store.randomRoomId}</h1>
       <button class="ui-button" onclick=${createRoom} >
        create
      </button>
  </div>
      `

  const treeHTML = () => html`
    <section>
    <div class="home-regl u-full no-interaction"></div>
    ${inputs.render(inputHTML(), "home")}
  </section>
  `

  store.on("room", v => inputs.render(inputHTML()))

  let regl
  function startGfx(el) {
    regl = HomeRegl(el.querySelector(".home-regl"))
  }
  function stopGfx() {
    regl.destroy()
  }

  return tree.render(
    treeHTML(),
    IS_DESKTOP
      ? {
          onload: el => {
            startGfx(el)
          },
          unload: () => stopGfx(),
        }
      : null
  )
}
