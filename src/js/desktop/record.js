import Gui from "../common/gui"
import { WIDTH, HEIGHT, FPS, AUDIO_EXP } from "../common"
const Record = () => {
  const recordStop = () => {}
  const frames = []
  let _audio, _duration

  var W = "ffmpeg-worker-mp4"

  function addFrame(frame) {
    frames.push(frame)
  }

  function addAudio(wav, duration) {
    _audio = wav
    _duration = duration.toFixed(1)
  }

  function transcode(blob, sound) {
    console.log(sound)
    console.log("will transcode", blob)
    return new Promise((resolve, reject) => {
      let worker = new Worker("ffmpeg-worker-mp4.js")
      let stderr, stdout
      worker.onmessage = e => {
        let msg = e.data
        console.log(msg)
        switch (msg.type) {
          case "ready":
            worker.postMessage({
              type: "run",
              mounts: [
                {
                  type: "WORKERFS",
                  opts: {
                    blobs: [
                      { name: "input.webm", data: blob },
                      { name: `sound${AUDIO_EXP}`, data: sound },
                    ],
                  },
                  mountpoint: "/data",
                },
              ],
              TOTAL_MEMORY: 536870912,
              arguments: [
                "-i",
                "/data/input.webm",
                "-i",
                `/data/sound${AUDIO_EXP}`,
                "-map",
                "0:v",
                "-map",
                "1:a",
                "-c:v",
                "libx264",
                "-b:v",
                "500k",
                /*"-c:a",
                "libmp3lame",*/
                "-pix_fmt",
                "yuv420p",
                "-f",
                "mp4",
                "-shortest",
                "output.mp4",
              ],
            })
            break
          case "stdout":
            stdout += msg.data + "\n"
            break
          case "stderr":
            stderr += msg.data + "\n"
            break
          case "done":
            worker.terminate()
            resolve(
              new Blob([msg.data.MEMFS[0].data], {
                type: "video/mp4",
              })
            )
            break
          case "exit":
            if (msg.data) {
              // exit code not zero
              worker.terminate()
              reject(msg.data)
            }
            break
          default:
            break
        }
      }
    })
  }

  function downloadData(blob, basename) {
    basename = basename || "output"
    let url = URL.createObjectURL(blob)
    let a = document.createElement("a")
    document.body.appendChild(a)
    a.style.display = "none"
    a.href = url
    a.download = `${basename}.${blob.type.split("/")[1]}`
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  function flipVertically(pixels, width, height) {
    // make a temp buffer to hold one row
    var halfHeight = Math.floor(height / 2)
    var bytesPerRow = width * 4
    var temp = new Uint8Array(width * 4)
    for (var y = 0; y < halfHeight; ++y) {
      var topOffset = y * bytesPerRow
      var bottomOffset = (height - y - 1) * bytesPerRow

      // make copy of a row on the top half
      temp.set(pixels.subarray(topOffset, topOffset + bytesPerRow))

      // copy a row from the bottom half to the top
      pixels.copyWithin(
        topOffset,
        bottomOffset,
        bottomOffset + bytesPerRow
      )

      // copy the copy of the top half row to the bottom half
      pixels.set(temp, bottomOffset)
    }
  }

  function start(canvasKey) {
    const id = new ImageData(WIDTH, HEIGHT)
    const keyCtx = canvasKey.getContext("2d")

    const webms = []
    canvasKey.width = WIDTH
    canvasKey.height = HEIGHT

    let _i = 0
    while (_i < frames.length) {
      flipVertically(frames[_i], WIDTH, HEIGHT)
      id.data.set(frames[_i])
      keyCtx.putImageData(id, 0, 0)
      frames[_i] = null
      webms.push(canvasKey.toDataURL("image/webp"))
      _i++
    }

    frames.length = 0

    const blob = window.Whammy.fromImageArray(
      webms,
      Math.floor(FPS / 2)
    )

    console.log("DONE")

    return transcode(blob, _audio).then(video => {
      downloadData(video)
      return video
    })
  }
  return {
    addFrame,
    addAudio,
    start,
  }
}

export default Record
