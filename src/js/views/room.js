import html from "choo/html"
import Component from "common/component"
import { IS_MOBILE } from "common/constants"

module.exports = ({store}, emit) => {
  emit("log:debug", "Rendering Room")

  if (!store.room.created) return null

  const renderCanvas = () =>
    IS_MOBILE
      ? null
      : html`<div class="u-canvas-container">
      <canvas class="canvas" id="c_output"></canvas>
      </div>`

    const renderPixi = () =>
    IS_MOBILE
      ? null
      : html`<div id="pixi" class="u-canvas-container">
      </div>`

  const tree = new Component()
//${renderPixi()}
  return tree.render(
    html`
    <section class="room u-full">
      <video class="u-full video--local" id="localVideo" playsinline autoplay ></video>
      <div class="u-full videos--remote" id="remoteVideos"></div>
      ${renderCanvas()}

    </section>
  `,
    {
      onload: () => {
        emit("view:room:onload")
      },
    }
  )
}
