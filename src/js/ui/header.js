import { throttle, mean, random } from "lodash"
import Socket from "common/socket"
import Gui from "common/gui"
import AppEmitter from "common/emitter"
import { logInfo, IS_DEV, WIDTH, HEIGHT } from "common/constants"

const Header = headerEl => {
  document.querySelectorAll(".ui-media").forEach(el => {
    el.style.filter = `hue-rotate(${random(360)}deg)`
    el.addEventListener("click", e =>
      onHeaderMediaClicked(e.target.dataset)
    )
  })

  let _webcamStarted = Gui.state.useWebcam
  let _isObserving = false
  const onHeaderMediaClicked = dataset => {
    switch (dataset.type) {
      case "observe": {
        if(_isObserving){
          AppEmitter.emit("observeviewer:stop")
        }else{
          AppEmitter.emit("observeviewer:start")
        }
        _isObserving = !_isObserving
        break
      }
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
