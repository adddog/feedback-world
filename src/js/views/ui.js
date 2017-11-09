import html from "choo/html"
import Component from "../common/component"
import Gui from "../common/gui"
import { IS_MOBILE } from "../common"

module.exports = (state, emit, emitter) => {
  if (!state.room.created) return null

  const tree = new Component()

  const getHTML = room => html`
    <section class="u-full">
      <h1 class="room--title" >In room ${room.id}</h1>
    </section>
  `

  Gui.on("disconnect", v => {
    tree.rerender()
  })

  emitter.on("room:change", v => {
    tree.update(getHTML({ id: v }))
    tree.rerender()
  })

  return tree.render(getHTML(state.room), "u-full RoomUi", {
    onload: () => {},
  })
}
