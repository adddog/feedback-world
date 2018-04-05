import AppEmitter from "common/emitter"
import { videoSettings } from "common/constants"
import { sample } from "lodash"
import Server from "common/server"
const Facebook = videoEl => {
  videoEl.setAttribute("crossorigin", "anonymous")
  videoEl.setAttribute("muted", true)
  //videoEl.setAttribute("loop", true)

  const _playNext = url => {
    videoEl.src = url
  }

  function auth() {
    return Server.facebook().then(t => {
      console.log(t);
    })
  }

  AppEmitter.on("facebook:auth", auth)

  return {
    auth,
  }
}

export default Facebook
