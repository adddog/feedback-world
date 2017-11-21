import AppEmitter from "common/emitter"
import { videoSettings } from "common/constants"
import { sample } from "lodash"
import Server from "common/server"
const Instagram = videoEl => {
  videoEl.setAttribute("crossorigin", "anonymous")
  videoEl.setAttribute("muted", true)
  //videoEl.setAttribute("loop", true)

  const _playNext = url => {
    videoEl.src = url
  }

  const _shuffle = videos => {}

  function load() {
    return Server.insta().then(t => {
      const videos = t.data
        .filter(d => !!d.videos)
        .map(d => d.videos.standard_resolution.url)
      videoEl.addEventListener("ended", () => {
        _playNext(sample(videos))
      })
      _playNext(sample(videos))
      AppEmitter.emit("insta:loaded")
      return videoEl
    })
  }

  AppEmitter.on("insta:start", load)

  return {
    load,
  }
}

export default Instagram
