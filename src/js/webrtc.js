import Model from "./model"
import Config from "./config"
import Regl from "./regl"
import Hammer from "hammerjs"
import { find } from "lodash"
import SimpleWebRTC from "simplewebrtc"

const FeedBacks = (roomName = "sam")=>{

  const webrtc = new SimpleWebRTC(
    {
      url:"https://rad.wtf/",
      autoRequestMedia: true,
      localVideoEl: "localVideo",
      remoteVideosEl: "remoteVideos",
      media: {
        video: Detector.isDesktop
          ? true
          : {
              facingMode: "environment",
            },
        audio: false,
      },
      // immediately ask for camera access
    },
    { mirror: false }
  )

  webrtc.on("readyToCall", function() {
    webrtc.joinRoom(roomName)
  })

  // local screen obtained
  let _peer
  webrtc.on("createdPeer", function(peer) {
    _peer = peer
    console.log(_peer);
  })

  webrtc.on("localScreenAdded", function(video) {
    /*navigator.mediaDevices.enumerateDevices().then(function(devices) {
      const guiDevices = gui.addFolder("Devices")
      let videoDevices = []
      for (var i = 0; i !== devices.length; ++i) {
        var device = devices[i]
        infoEl.innerHTML += device.label
      }
    })*/
    /*video.onclick = function() {
      video.style.width = video.videoWidth + "px"
      video.style.height = video.videoHeight + "px"
    }
    document.getElementById("localScreenContainer").appendChild(video)
    $("#localScreenContainer").show()*/
  })
  // local screen removed
  webrtc.on("localScreenRemoved", function(video) {})
  webrtc.on("handlePeerStreamAdded", function(peer) {
    console.log(peer);
  })

  let colors = []
  let colorCount = 0

  const videoEl = document.getElementById("localVideo")
  const remoteVideosEl = document.getElementById("remoteVideos")
  const canvasEl = document.getElementById("ci")
  canvasEl.width = WIDTH
  canvasEl.height = HEIGHT
  const canvasOff = document.createElement("canvas")

  const ctx = canvasOff.getContext("2d")
  canvasOff.width = window.innerWidth
  canvasOff.height = window.innerHeight

  const regl = Regl(canvasEl)

  if (Detector.isDesktop) {
    videoEl.style.display = "none"
  } else {
    remoteVideosEl.style.display = "none"
    canvasEl.style.display = "none"
  }

  remoteVideosEl.style.display = "none"

  const hammertime = new Hammer(document.body)
  hammertime.on("tap", function(e) {

    ctx.drawImage(
      videoEl,
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
    let frame = ctx.getImageData(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )

    let color = [
      frame.data[e.center.x * e.center.y * 4],
      frame.data[e.center.x * e.center.y * 4 + 1],
      frame.data[e.center.x * e.center.y * 4 + 2],
    ]

    colorCount++

    colors = [...colors, ...color]

    webrtc.sendToAll("text", color)
  })

  document.body.addEventListener("click", e => {

    ctx.drawImage(
      videoEl,
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
    let frame = ctx.getImageData(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )

    let color = [
      frame.data[e.clientX * e.clientY * 4],
      frame.data[e.clientX * e.clientY * 4 + 1],
      frame.data[e.clientX * e.clientY * 4 + 2],
    ]

    colorCount++

    colors = [...colors, ...color]

    webrtc.sendToAll("text", color)

    console.log(color);

    if (!Detector.isDesktop) {
      regl.update(
        {
          img: canvasOff,
        },
        {
          knockout: color,
          key: colors,
          keyCount: colorCount,
          width: window.innerWidth,
        }
      )
    }
  })

  let knockout = [0,0,0]
  webrtc.connection.on("message", function(data) {
    if (data.type === "text") {
      console.log(data)
      knockout = data.payload
      //do something with data.payload.message
    }
  })

  let _c = 0
  if (Detector.isDesktop) {
    const engine = loop(function(dt) {
      if (_peer && _peer.videoEl) {
        let color = [0, 0, 0]
        if (
          _peer.videoEl.readyState >= _peer.videoEl.HAVE_CURRENT_DATA && _c % 12 === 0
        ) {
          regl.update(
            {
              img: _peer.videoEl,
              keyVideo:videoEl//document.getElementById("keyVideo")
            },
            {
              knockout: knockout,
              key: [...color],
              keyCount: 1,
              width: window.innerWidth,
            }
          )
        console.log("render");
        }
      }
      _c++
    }).start()
  }
}
export default FeedBacks

const WIDTH = 480
const HEIGHT = 480

const loop = require("raf-loop")

// Include dat.gui sliders
const dat = require("dat.gui/build/dat.gui.js")
const gui = new dat.GUI()

const isProd = process.env.NODE_ENV === "production"

let baseRoute = ""
if (isProd) {
  baseRoute = "rad.wtf"
} else if (process.env.NODE_ENV === "github") {
}

require("fastclick")(document.body)

var html = require("choo/html")
var log = require("choo-log")
var choo = require("choo")

var app = choo()

if (!isProd) {
  function logger(state, emitter) {
    emitter.on("*", function(messageName, data) {
      //console.log('event', messageName, data)
    })
  }

  app.use(log())
  app.use(logger)
}

const onload = el => {
  var webrtc = new SimpleWebRTC(
    {
      url:"https://rad.wtf/",
      autoRequestMedia: true,
      localVideoEl: "localVideo",
      remoteVideosEl: "remoteVideos",
      media: {
        video: Detector.isDesktop
          ? true
          : {
              facingMode: "environment",
            },
        audio: false,
      },
      // immediately ask for camera access
    },
    { mirror: false }
  )

  webrtc.on("readyToCall", function() {
    webrtc.joinRoom("sam")
  })


  function showVolume(el, volume) {}

  // we got access to the camera
  webrtc.on("localStream", function(stream) {
    /*var button = document.querySelector("form>button")
    if (button) button.removeAttribute("disabled")
    $("#localVolume").show()*/
  })
  // we did not get access to the camera
  webrtc.on("localMediaError", function(err) {})

  // local screen obtained
  let _peer
  webrtc.on("createdPeer", function(peer) {
    _peer = peer
    console.log(_peer);
  })

  webrtc.on("localScreenAdded", function(video) {
    /*navigator.mediaDevices.enumerateDevices().then(function(devices) {
      const guiDevices = gui.addFolder("Devices")
      let videoDevices = []
      for (var i = 0; i !== devices.length; ++i) {
        var device = devices[i]
        infoEl.innerHTML += device.label
      }
    })*/
    /*video.onclick = function() {
      video.style.width = video.videoWidth + "px"
      video.style.height = video.videoHeight + "px"
    }
    document.getElementById("localScreenContainer").appendChild(video)
    $("#localScreenContainer").show()*/
  })
  // local screen removed
  webrtc.on("localScreenRemoved", function(video) {})

  let colors = []
  let colorCount = 0

  const videoEl = document.getElementById("localVideo")
  const remoteVideosEl = document.getElementById("remoteVideos")
  const canvasEl = document.getElementById("ci")
  canvasEl.width = WIDTH
  canvasEl.height = HEIGHT
  const canvasOff = document.createElement("canvas")

  const ctx = canvasOff.getContext("2d")
  canvasOff.width = window.innerWidth
  canvasOff.height = window.innerHeight

  const regl = Regl(canvasEl)

  if (Detector.isDesktop) {
    videoEl.style.display = "none"
  } else {
    remoteVideosEl.style.display = "none"
    canvasEl.style.display = "none"
  }

  remoteVideosEl.style.display = "none"

  const hammertime = new Hammer(document.body)
  hammertime.on("tap", function(e) {

    ctx.drawImage(
      videoEl,
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
    let frame = ctx.getImageData(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )

    let color = [
      frame.data[e.center.x * e.center.y * 4],
      frame.data[e.center.x * e.center.y * 4 + 1],
      frame.data[e.center.x * e.center.y * 4 + 2],
    ]

    colorCount++

    colors = [...colors, ...color]

    webrtc.sendToAll("text", color)
  })

  document.body.addEventListener("click", e => {

    ctx.drawImage(
      videoEl,
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )
    let frame = ctx.getImageData(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    )

    let color = [
      frame.data[e.clientX * e.clientY * 4],
      frame.data[e.clientX * e.clientY * 4 + 1],
      frame.data[e.clientX * e.clientY * 4 + 2],
    ]

    colorCount++

    colors = [...colors, ...color]

    webrtc.sendToAll("text", color)

    console.log(color);

    if (!Detector.isDesktop) {
      regl.update(
        {
          img: canvasOff,
        },
        {
          knockout: color,
          key: colors,
          keyCount: colorCount,
          width: window.innerWidth,
        }
      )
    }
  })

  let knockout = [0,0,0]
  webrtc.connection.on("message", function(data) {
    if (data.type === "text") {
      console.log(data)
      knockout = data.payload
      //do something with data.payload.message
    }
  })

  let _c = 0
  if (Detector.isDesktop) {
    const engine = loop(function(dt) {
      if (_peer && _peer.videoEl) {
        let color = [0, 0, 0]
        if (
          _peer.videoEl.readyState >= _peer.videoEl.HAVE_CURRENT_DATA && _c % 12 === 0
        ) {
          regl.update(
            {
              img: _peer.videoEl,
              keyVideo:videoEl//document.getElementById("keyVideo")
            },
            {
              knockout: knockout,
              key: [...color],
              keyCount: 1,
              width: window.innerWidth,
            }
          )
        }
      }
      _c++
    }).start()
  }
}

//VIEWS

const home = require("./views/home")

const popupRequest = require("./views/popupRequest")
const popupAccept = require("./views/popupAccept")
const popupConnect = require("./views/popupConnect")
const imageUpload = require("./views/imageUpload")
const webgl = require("./views/webgl")
//<video id="keyVideo" playsinline muted loop autoplay src="test.mp4" ></video>
function mainView(state, emit) {
  return html`
    <div
    class="app"
    onload=${onload}
    >
        <span id="info"></span>

        <video id="localVideo" playsinline autoplay ></video>
        <div id="remoteVideos"></div>
        <span>${Config.id}</span>
        <div class="canvas_cont">
          <canvas id="ci"></canvas>
        </div>
    </div>
  `
}
app.route(`/${baseRoute}`, mainView)

var tree = app.start()
document.body.appendChild(tree)
