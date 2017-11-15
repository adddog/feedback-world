import { throttle, mean, random } from "lodash"
import Socket from "../socket"
import Gui from "../common/gui"
import AppEmitter from "../common/emitter"
import { logInfo, IS_DEV, WIDTH, HEIGHT } from "../common"

const Header = headerEl => {
  document.querySelectorAll(".ui-media").forEach(el => {
    el.style.filter = `hue-rotate(${random(360)}deg)`
    el.addEventListener("click", e =>
      onHeaderMediaClicked(e.target.dataset)
    )
  })

  let _webcamStarted = Gui.state.useWebcam
  const onHeaderMediaClicked = dataset => {
    switch (dataset.type) {
      case "insta": {
        AppEmitter.emit("insta:start")
        break
      }
      case "webcam": {
        if (!_webcamStarted) {
          AppEmitter.emit("webcam:start")
        } else {
          AppEmitter.emit("webcam:stop")
        }
        _webcamStarted = !_webcamStarted
        break
      }
    }
  }
}

export default Header
