import observable from "proxy-observable"
import { IS_DEV,IS_PROD } from "./index"
import Server from "./server"
const dat = require("dat.gui/build/dat.gui.js")

const o = observable({
  state:null,
  localPeerId:null,

  errorMsg:"",
  infoMsg:"",

  recordSamples:0,
  recordProgress: 0,

  secret:null,
  tolerance: 0.5,
  slope: 0.08,
  uSaturation: 1.,
  echo: {
    feedback: 0.5,
    delay: 1,
    dry: 0.5,
  },
  reverb: {
    time: 1,
    decay: 5,
  },
  panner:{
    value:0.5
  },
  deviceMotion:{
    x:0,
    y:0,
    z:0,
  },
  deviceOrien:{
    alpha:0,
    beta:0,
    gamma:0,
  },

  mobileDeviceOrientation:{
    landscape:false
  },

  started: false,
  connect: false,
  disconnect: false,

  recording: false,
  rendering: false,
  finalRecordProgress: 0,

  startWebcam:()=>{},
  stopWebcam:()=>{},

  recordStart: () => {},
  recordEnd: () => {},
  recordFinalStart: () => {},
  recordFinalStop: () => {},
  instagram: () => {
    Server.insta().then(t=>{
      console.log(t);
    })
  },
})

if(!IS_PROD){
  const gui = new dat.GUI()
  gui.add(o, "tolerance", 0, 1)
  gui.add(o, "slope", 0, 1)
  gui.add(o, "startWebcam")
  gui.add(o, "stopWebcam")
  gui.add(o, "recordStart")
  gui.add(o, "recordEnd")
  gui.add(o, "recordFinalStart")
  gui.add(o, "recordFinalStop")
  gui.add(o, "instagram")
  gui.close()
}


export const connect = ()=>{
  o.disconnect = false
  o.connect = true
}

export const disconnect = ()=>{
  o.connect = false
  o.disconnect = true
  o.recording = false
  o.rendering = false
}

export default o
