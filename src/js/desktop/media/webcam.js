import Gui from "common/gui"
import { videoSettings } from "common/constants"
const Webcam = webrtc => {
  let _stream
  function start() {
    return new Promise((yes, no) => {
      webrtc.webrtc.start(
        { video: { ...videoSettings }, audio: false },
        (err, stream) => {
          if (err) {
            no(err)
          } else {
            _stream = stream
            yes(stream)
          }
        }
      )
    })
  }

  function stop() {
    if(!_stream) return
    webrtc.webrtc.stop(_stream)
  }

  return {
    started: !!_stream,
    start,
    stop,
  }
}

export default Webcam
