import html from "choo/html"
import { IS_MOBILE } from "common/constants"
import Component from "common/component"
import Gui from "common/gui"
import AppEmitter from "common/emitter"

module.exports = ({ store }, emit, emitter) => {
  if (!store.room.created) return null

  const tree = new Component()
  const header = new Component()
  const messages = new Component()
  const comms = new Component()

  const headerHTML = data => html`
    <div class="ui-header-items">
      <h1><span>in room</span> ${data.id}</h1>
        <div class="ui-medias">
          <div data-type="observe" class="ui-media ui-media--observe"></div>
          <div data-type="insta" class="ui-media ui-media--insta"></div>
          <div data-type="webcam" class="ui-media ui-media--webcam"></div>
          <div class="ui-tooltip ui-tooltip--bottom"><span>visual media</span></div>
        </div>
    </div>`

  const appMessagesHTML = data =>
    html`<span class="${data.class || ""}">${data.msg || ""}</span>`

  const commsHTML = data =>
    html`
      <div class="ui-comms-items">
        <span class="ui-comm--you">${data.you}</span>
        <span class="ui-comm--remote">${data.remote}</span>
      </div>`

  const getHTML = data => html`
    <section class="u-full">
      ${renderHeader()}
      <div class="ui-footer">
        <div class="ui-record-c">
          <div class="ui-tooltip ui-tooltip--bottom">visual media</div>
          <div class="ui-record ui-record--micro"></div>
          <div class="ui-record ui-record--frame"></div>
          <div class="ui-record ui-record--render hide"></div>
        </div>
        <div id="pixi" class="ui-pixi">
          <div class="ui-pixi-labels">
            <span>softness</span>
            <span>amount</span>
          </div>
          <div class="ui-tooltip ui-tooltip--top"><span>mixer</span></div>
        </div>
        <div class="ui-rooms">
          <div class="ui-room hide ui-room--0"><span></span></div>
          <div class="ui-room hide ui-room--1"><span></span></div>
          <div class="ui-room hide ui-room--2"><span></span></div>
          <div class="ui-room hide ui-room--3"><span></span></div>
        </div>
      </div>
      ${renderAppMessages()}
      ${renderComms()}
    </section>
  `

  //***
  // HEADR
  //***
  const renderHeader = (data = {}) =>
    header.render(headerHTML(data), "ui-header")

  emitter.on("room:change", v => {
    renderHeader({ id: v })
  })


  //***
  // APP MESSAGES
  //***
  const renderAppMessages = (data = {}) =>
    messages.render(appMessagesHTML(data), "ui-messages")

  Gui.on("infoMsg", v =>
    renderAppMessages({ msg: v, class: "ui-messages--info" })
  )

  Gui.on("errorMsg", v =>
    renderAppMessages({ msg: v, class: "ui-messages--error" })
  )
  Gui.on("finalRecordProgress", v =>
    renderAppMessages({
      msg: !!v ? `${Math.ceil(v * 100)}% through encoding your .mp4` : "",
      class: "ui-messages--info",
    })
  )

  //***
  // COMM TYPING
  //***

  let _commData = {
    you: "",
    remote: "",
  }
  const renderComms = (data = {}) => {
    _commData = { ..._commData, ...data }
    return comms.render(commsHTML(_commData), "ui-comms")
  }

  AppEmitter.on("desktop:communcation", str =>
    renderComms({ you: str })
  )
  AppEmitter.on("desktop:communcation:remote", str =>
    renderComms({ remote: str })
  )

  return tree.render(getHTML(store.room), "u-full RoomUi", {
    onload: () => {
      emit("view:ui:onload")
    },
  })
}
