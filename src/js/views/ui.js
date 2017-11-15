import html from "choo/html"
import Component from "../common/component"
import Gui from "../common/gui"
import { IS_MOBILE } from "../common"

module.exports = ({ store }, emit, emitter) => {
  if (!store.room.created) return null

  const tree = new Component()

  const getHTML = data => html`
    <section class="u-full">
      <div class="ui-header">
        <h1><span>in room</span> ${data.id}</h1>
        <div class="ui-medias">
          <div data-type="webcam" class="ui-media ui-media--webcam"></div>
          <div data-type="insta" class="ui-media ui-media--insta"></div>
        </div>
      </div>
      <div class="ui-footer">
        <div class="ui-record-c">
          <div class="ui-record ui-record--micro"></div>
        </div>
        <div class="ui-rooms">
          <div class="ui-room hide ui-room--0"><span></span></div>
          <div class="ui-room hide ui-room--1"><span></span></div>
          <div class="ui-room hide ui-room--2"><span></span></div>
          <div class="ui-room hide ui-room--3"><span></span></div>
        </div>
      </div>
      <div class="ui-error">
        <span>${data.errorMsg || ""}</span>
      </div>
    </section>
  `

  Gui.on("disconnect", v => {
    tree.rerender()
  })

  emitter.on("room:change", v => {
    tree.update(getHTML({ id: v }))
    tree.rerender()
  })

  store.on("errorMsg", v => tree.update(getHTML({ errorMsg: v })))

  return tree.render(getHTML(store.room), "u-full RoomUi", {
    onload: () => {},
  })
}
