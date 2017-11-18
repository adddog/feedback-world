import html from "choo/html"
import QS from "query-string"
import Component from "../common/component"
import HomeRegl from "./home-regl"
import { IS_DESKTOP, WIDTH, HEIGHT } from "../common"
var bel = require("bel")

const renderText = () =>
  IS_DESKTOP
    ? html`<div class="home-instruction">
    <div class="home-instruction--slogan">right here in front of you</div>
    <div class="home-instruction--instr">If you know your phone's room number, enter it. <br> Or make your own room; pre-filled below</div>
    </div>`
    : html``

module.exports = ({ store }, emit) => {
  emit("log:debug", "Rendering home view")

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
  const inputHTML = (data = {}) => html`
  <div>
    <div class="home-title"></div>
    ${renderText()}
    <input
        class="u-input"
        value=${data.id || store.room.id}
        autofocus
        onkeyup=${createRoomInput}
        placeholder="${data.id ||
          data.randomRoomId ||
          store.randomRoomId}"/>
        <div class="u-wide u-center">
        <button class="ui-button" onclick=${joinRoom}>
        join ${data.randomRoomId ||
          store.room.id ||
          store.randomRoomId}
      </button>
      </div>
  </div>
      `

  /*
      <div><span>use webcam</span><input label="use webcam" checked=${store.useWebcam
        ? "checked"
        : "false"}  type="checkbox" onchange=${changeCheckbox}></div>
      <h1>join new room ${store.randomRoomId}</h1>
       <button class="ui-button" onclick=${createRoom} >
        create
      </button>
      */

  const treeHTML = () => html`
    <section>
    <div class="home-regl u-full no-interaction"></div>
    ${inputs.render(inputHTML(), "home")}
  </section>
  `

  store.on("room", v => inputs.render(inputHTML(v)))
  store.on("randomRoomId", v => {
    inputs.render(inputHTML({ randomRoomId: v }))
  })

  let regl
  function startGfx(el) {
    regl = HomeRegl(el.querySelector(".home-regl"))
  }
  function stopGfx() {
    regl.destroy()
  }

  return tree.render(
    treeHTML(),
    (IS_DESKTOP && !QS.parse(location.search).norender)
      ? {
          onload: el => {
            startGfx(el)
          },
          unload: () => stopGfx(),
        }
      : null
  )
}
