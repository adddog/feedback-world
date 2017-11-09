import MediaStreamRecorder from "msr"
import sono from "sono"
import "sono/utils/recorder"
import "sono/utils/microphone"

import Effects from "sono/effects"
import Gui from "../common/gui"
import Recorder from "./soundRecorder"
import MSRecorder from "./mediaStreamRecorder"
import { AUDIO_EXP, AUDIO_EXP_TYPE, MAX_RECORD_TIME } from "../common"

const Sound = () => {
  let _started = false

  let mediaRecorder, mediaRecorder2
  let fileReader = new FileReader()
  const _sounds = []

  const addSound = (sound, blob) => {
    _sounds.push({
      blob: blob,
      sound: sound,
      echo: sound.effects.add(Effects.echo(Gui.echo)),
      reverb: sound.effects.add(Effects.reverb(Gui.reverb)),
      panner: sound.effects.add(Effects.panner(Gui.panner)),
    })

    Gui.on("echo", value => {
      _sounds.forEach(s => {
        for (var k in value) {
          s.echo[k] = value[k]
        }
      })
    })

    Gui.on("panner", value => {
      _sounds.forEach(s => {
        s.panner.set(value.value)
      })
    })

    Gui.on("reverb", value => {
      for (var k in value) {
        //reverb[k] = value[k]
      }
    })

    sound.loop = true
    sound.play()
  }

  function init(stream) {
    if (_started || !stream) return
    _started = true

    mediaRecorder = new MediaStreamRecorder(stream)
    mediaRecorder.mimeType = `audio/${AUDIO_EXP_TYPE}` // check this line for audio/wav

    mediaRecorder.ondataavailable = function(blob) {
      //Recorder.setupDownload(blob, `record${AUDIO_EXP}`)
      fileReader.onloadend = () => {
        sono.load({
          data: fileReader.result,
          onComplete: sound => {
            addSound(sound, blob)
          },
        })
      }
      fileReader.readAsArrayBuffer(blob)
    }
  }

  let _rProgress
  function recordStart() {
    mediaRecorder.start()
    clearInterval(_rProgress)
    let _t = 0
    _rProgress = setInterval(() => {
      _t += 10
      Gui.recordProgress = _t / MAX_RECORD_TIME
      if (_t >= MAX_RECORD_TIME) {
        recordEnd()
      }
    }, 10)
  }

  function recordEnd() {
    if (!Gui.recordProgress) return
    mediaRecorder.stop()
    clearInterval(_rProgress)
    Gui.recordProgress = 0
  }

  function recordMasterStart(cb) {
    var stream_dest = sono.context.createMediaStreamDestination()
    sono.gain.connect(stream_dest)

    mediaRecorder2 = new MSRecorder(stream_dest.stream, {
      type: `audio/${AUDIO_EXP_TYPE}\;codecs=opus`,
    })
    mediaRecorder2.start()
  }

  function recordMasterStop(cb) {
    mediaRecorder2.stop(blob => {
      cb(blob, 2)
    })
  }

  Gui.recordStart = recordStart
  Gui.recordEnd = recordEnd

  Gui.on("disconnect", v => {
    if (!v) {
      if (mediaRecorder) {
        mediaRecorder.stop()
        mediaRecorder = null
      }
      if (mediaRecorder2) {
        mediaRecorder2.stop()
        mediaRecorder2 = null
      }

      _started = false
      _sounds.forEach(obj => {
        obj.blob = null
        obj.sound.destroy()
        obj.echo = null
        obj.reverb = null
        obj.panner = null
      })
      _sounds.length = 0
    }
  })

  return {
    init,
    recordMasterStart,
    recordMasterStop,
    sounds: _sounds,
    recordStart,
    recordEnd,
  }
}

export default Sound
