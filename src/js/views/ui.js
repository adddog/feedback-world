import html from "choo/html"
import Component from "../common/component"
import Gui from "../common/gui"
import { IS_MOBILE } from "../common"

module.exports = ({store}, emit, emitter) => {
  if (!store.room.created) return null

  const tree = new Component()

  const getHTML = room => html`
    <section class="u-full">
      <div class="ui-header">
        <h1 class="room--title" >In room ${room.id}</h1>
      </div>
      <div class="ui-record-c">
      <div class="ui-record ui-record--micro">

        </div>
      </div>
      <div class="ui-rooms"></div>
    </section>
  `

  Gui.on("disconnect", v => {
    tree.rerender()
  })

  emitter.on("room:change", v => {
    tree.update(getHTML({ id: v }))
    tree.rerender()
  })

  return tree.render(getHTML(store.room), "u-full RoomUi", {
    onload: () => {},
  })
}
