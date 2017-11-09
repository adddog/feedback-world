import { videoSettings } from "../common"
import { sample } from "lodash"
import Server from "../common/server"
const Instagram = videoEl => {
  videoEl.setAttribute("crossorigin", "anonymous")
  videoEl.setAttribute("muted", true)
  //videoEl.setAttribute("loop", true)

  const _playNext = url => {
    videoEl.src = url
  }

  const _shuffle = videos => {}

  function load(cb) {
    Server.insta().then(t => {
      const videos = t.data.filter(d => !!d.videos).map(d=>d.videos.standard_resolution.url)
      videoEl.addEventListener("ended", () => {
        _playNext(sample(videos))
      })
      _playNext(sample(videos))
      cb(videoEl)
    })
  }

  return {
    load,
  }
}

export default Instagram
