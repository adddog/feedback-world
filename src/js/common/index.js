import Detector from "./detector"
import colors from "nice-color-palettes"
import tiza from "tiza"
import { map } from "lodash"

const error = tiza.color("red").text
const info = tiza.bold().bgColor("yellow").text
const success = tiza.bold().bgColor("#ABEDD1").text

export const logError = str => tiza.log(error(str))
export const logInfo = str => tiza.log(info(str))
export const logSuccess = str => tiza.log(success(str))

export const videoSettings = {
  width: { max: WIDTH },
  height: { max: HEIGHT },
  frameRate: { max: FPS },
}

export const COLOR_P = process.env.NODE_ENV === "production"

export const IS_PROD = process.env.NODE_ENV === "production"
export const IS_DEV = process.env.NODE_ENV !== "production"

export const SERVER_URL = IS_DEV
  ? "https://rad.ngrok.io/"
  : "https://rad.wtf"

export const IS_MOBILE = !Detector.isDesktop
export const IS_DESKTOP = Detector.isDesktop
export const WIDTH = 640
export const HEIGHT = 480

export const MAX_RECORD_TIME = 5000
export const FPS = 18
export const FPS_I = 1000 / FPS

export const RECORD_FRAMES_DELAY = 1500

export const ALPHA_SENS = 50
export const AUDIO_EXP = ".webm"
export const AUDIO_EXP_TYPE = "webm"

export const KEY_W = 8
export const KEY_H = 8

export const M_SCREEN_ORIEN = "local:mobile:screenOrientation"
export const M_SCREEN_SIZE = "local:mobile:screenSize"
export const M_DEVICE_MOTION = "local:mobile:deviceMotion"
export const M_DEVICE_ORIEN = "local:mobile:deviceOrientation"

export const hasPeer = (values, peer) => {
  let _found = false
  for (let val of values) {
    if (val.id === peer.id) {
      _found = true
      break
    }
  }
  return _found
}

export const findPeer = (values, id) => {
  for (let peer of values) {
    if (peer.id === id) return peer
  }
  return null
}

export const numberDesktops = values => {
  let c = 0
  for (let val of values) {
    if (val.desktop) c++
  }
  return c
}

export const createVideoElFromStream = stream => {
  const v = document.createElement("video")
  v.width = WIDTH
  v.height = HEIGHT
  v.srcObject = stream
  v.classList.add("canvas")
  return v
}
