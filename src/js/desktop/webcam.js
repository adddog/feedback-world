import Gui from "../common/gui"
import { videoSettings } from "../common"
const Webcam = webrtc => {
  function start() {
    return new Promise((yes, no) => {
      webrtc.webrtc.start(
        { video: { ...videoSettings }, audio: false },
        (err, stream) => {
          if (err) {
            no(err)
          } else {
            Gui.state.useWebcam = true
            yes(stream)
          }
        }
      )
    })
  }

  function stop(videoEl) {
    webrtc.webrtc.stop(videoEl.srcObject)
    videoEl = null
  }

  return {
    started: Gui.state.useWebcam,
    start,
    stop,
  }
}

export default Webcam
