import html from "choo/html"
import {
  WIDTH,
  HEIGHT,
  createVideoElFromStream,
} from "common/constants"
import AppEmitter from "common/emitter"
const ObserveViewer = () => {
  let _window
  const w = WIDTH / 2
  const h = HEIGHT / 2

  function start() {
    stop()

    var width = screen.availWidth
    var height = screen.availHeight

    var left = width - w
    var top = height - h

    console.log(left, top)

    _window = window.open(
      window.location.href,
      null,
      `height=${h},width=${w},status=yes,toolbar=no,menubar=no,location=no,left=${left},top=${top}`
    )
  }

  function stop() {
    if (!_window) return
    _window.close()
    _window = null
  }

  function addStream(stream) {
    if (!stream) return
    if (!_window) start()
    _window.document.write(
      `<html><body style="margin:0"; video{position:absolute;left:0;top:0;width:${w}px;height:${h}px;}></body></html>`
    )
    _window.document.body.appendChild(
      createVideoElFromStream(stream, { width: w, height: h })
    )
  }

  window.onbeforeunload = function(e) {
    stop()
  }

  AppEmitter.on("window:close", () => stop)

  return {
    started: !!_window,
    addStream,
    start,
    stop,
  }
}

export default ObserveViewer
