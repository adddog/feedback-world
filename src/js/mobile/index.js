import Gui from "common/gui"
import AppEmitter from "common/emitter"
import QS from "query-string"
import Regl from "threed"
import Video from "./video"
import Geometry from "./geometry"
import Interaction from "./interaction"
import DesktopInteraction from "ui/interaction"
import {
  first,
  last,
  find,
  map,
  filter,
  flatten,
  compact,
} from "lodash"
import Accelerometer from "common/accelerometer"
import loop from "raf-loop"
import {
  ALPHA_SENS,
  WIDTH,
  FPS,
  HEIGHT,
  KEY_W,
  KEY_H,
  FPS_I,
  RENDERING_KEYS,
  M_SCREEN_ORIEN,
  M_DEVICE_ORIEN,
  M_DEVICE_MOTION,
  M_SCREEN_SIZE,
  resizeCanvas,
  logError,
  logInfoB,
  logInfo,
  postMsg,
  logSuccess,
  findPeer,
} from "common/constants"

const Mobile = (webrtc, state, emitter) => {
  if (Detector.isDesktop) return

  const peers = new Set()
  const peerIds = new Map()
  const keyColors = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]

  const renderSettings = {
    single: false,
    multi: false,
    [RENDERING_KEYS[0]]: {
      isReady: false,
      el: null,
    },
    [RENDERING_KEYS[1]]: {
      isReady: false,
      el: null,
    },
  }

  const desktopPeer = {
    id: null,
    peer: null,
    secret: null,
  }
  const mobilePeer = {
    el: null,
    secret: null,
    targetKey: null,
    id: null,
    peer: null,
    engaged: false,
    isReady: false,
  }
  const keyVideo = {
    isReady: false,
    el: null,
    targetKey: null,
  }

  const canvasEl = document.getElementById("c_output")
  canvasEl.width = WIDTH
  canvasEl.height = HEIGHT

  const canvasKey = document.createElement("canvas")
  canvasKey.width = KEY_W
  canvasKey.height = KEY_H
  const keyCtx = canvasKey.getContext("2d")


  let regl

  const roomEl = document.body.querySelector(".room")

  const videoEl = document.getElementById("localVideo")
  //canvasEl.style.display = "none"
  videoEl.style.display = "none"
  videoEl.setAttribute("autoplay", true)
  videoEl.setAttribute("playsinline", "")
  videoEl.setAttribute("crossorigin", "anonymous")
  videoEl.addEventListener("loadeddata", () => {
    logInfo(`local video ready`)
    //setVideoToKey(videoEl)
    slotIntoRenderingMedia(videoEl)

     regl = Regl(canvasEl, {
      video: {
        source: videoEl,
        width: WIDTH,
        height: HEIGHT,
      },
    })

    /*const regl = Regl(canvasEl, {
      video: {
        source: el,
        width: WIDTH,
        height: HEIGHT,
      },
    })*/
  })

  postMsg(`MESSGAE`)

  const remoteVideoEl = document.getElementById("remoteVideos")
  remoteVideoEl.style.display = "none"

  const interaction = Interaction(webrtc)
  const accelerometer = Accelerometer()
  const geometry = Geometry()

  accelerometer.on("devicemotion", state => {
    geometry.setAcceleration(state)
    send(M_DEVICE_MOTION, state)
  })

  accelerometer.on("rotationvector", data => {
    if (isPaired) {
      geometry.push(data)
      //send("rotationvector", geometry.geo[geometry.geo.length - 1])
    }
  })
  accelerometer.on("device:quaternion", quaternion =>
    send("local:mobile:quaternion", quaternion)
  )

  accelerometer.on("deviceorientation", state => {
    if (state.landscape) {
      state.alpha = -1 * state.alpha / ALPHA_SENS
    }
    send(M_DEVICE_ORIEN, state)
  })

  accelerometer.on("orientationchange", state => {
    send(M_SCREEN_ORIEN, state)
  })

  const createCanvasStream = () => {
    const stream = canvasEl.captureStream(FPS)
    webrtc.webrtc.localStreams.unshift(stream)
    //toggleMediaStream(false)
    logSuccess(
      `Created canvas stream (createCanvasStream) ${stream.id}. localStreams length: ${webrtc
        .webrtc.localStreams.length}`
    )
    /*const v = document.createElement("video")
    v.width = WIDTH
    v.height = HEIGHT
    v.srcObject = stream
    v.classList.add("canvas")
    document.body.appendChild(v)*/
  }

  const setVideoToKey = el => {
    keyVideo.el = el
    keyVideo.isReady = true
    keyVideo.targetKey = addRenderingMedia(keyVideo.el, "keyVideo")
    logSuccess(`keyVideo.isReady ${true}`)
  }

  webrtc.on("peerRemoved", peer => {
    const foundPeer = findPeer(peerIds.values(), peer.id)
    if (foundPeer.desktop) {
      stopRemoteDesktopStream()
      disconnectTromOtherDesktop()
    }
    peers.delete(peer)
    peerIds.delete(peer.id)
    cancelStreamFromPeer(peer)
    console.log(`Peer left ${peer.id}`)
    console.log(`Peers remaining: ${peerIds.size}`)
    if (pairedMobile.id === peer.id) {
      console.log(`Mobile left ${peer.id}`)
      reset()
    }
  })

  const reset = () => {
    localVideo.isReady = false
    isReady = false
    pairedMobile.engaged = false
    pairedMobile.isReady = false
    pairedMobile.id = null
    pairedMobile.secret = null
    pairedMobile.uuid = null
    pairedMobile.peer = null
  }

  const cancelStream = stream => {
    if (!stream) return
    stream.getTracks().forEach(track => track.stop())
    logError(`cancelStream ${stream.id}`)
  }

  const cancelStreamFromPeer = peer => {
    if (!peer) return
    if (!peer.stream) return
    cancelStream(peer.stream)
    logError(`cancelStreamFromPeer ${peer.id}`)
  }

  const onVideoStopped = videoEl => {
    if (renderSettings.mainVideo.el === videoEl) {
      renderSettings.mainVideo.el = null
      renderSettings.mainVideo.isReady = false
      renderSettings.multi = false
    } else if (renderSettings.keyVideo.el === videoEl) {
      renderSettings.keyVideo.el = null
      renderSettings.keyVideo.isReady = false
      renderSettings.multi = false
    }

    if (!renderSettings.multi && renderSettings.single) {
      renderSettings.single = true
    }
    logInfo(`onVideoStopped() - renderSettings:`)
    console.log(renderSettings)
  }

  webrtc.on("videoRemoved", (videoEl, peer) => {
    logInfoB(`videoRemoved ${peer.id}`)
    onVideoStopped(videoEl)
  })

  const slotIntoRenderingMedia = videoEl => {
    const availableSlots = RENDERING_KEYS.filter(
      key => !renderSettings[key].isReady
    )
    const targetKey = first(availableSlots)
    logInfoB(`slotIntoRenderingMedia() - using ${targetKey}`)
    if (targetKey) {
      renderSettings[targetKey].isReady = true
      renderSettings[targetKey].el = videoEl
      if (availableSlots.length === 1) {
        logInfoB(`slotIntoRenderingMedia() - rendering multi`)
        renderSettings.multi = true
        renderSettings.single = false
      } else {
        logInfoB(`slotIntoRenderingMedia() - rendering single`)
        renderSettings.single = true
        renderSettings.multi = false
      }
    } else {
      logError(`NO AVAILBLE PLACE FOR VIDEO EL`)
      return null
    }
    return targetKey
  }

  const addRenderingMedia = (videoEl, targetKey, force = false) => {
    if (renderSettings[targetKey].isReady) {
      logError(
        `ALREADY RENDERING ON ${targetKey}, will slot into available spot. Force? ${force}`
      )
      if (!force) {
        return slotIntoRenderingMedia(videoEl)
      } else {
        onVideoStopped(renderSettings[targetKey].el)
      }
    }
    renderSettings[targetKey].el = videoEl
    renderSettings[targetKey].isReady = true
    if (renderSettings.single) {
      renderSettings.multi = true
      renderSettings.single = false
    } else if (!renderSettings.single) {
      renderSettings.single = true
      renderSettings.multi = false
    }
    logInfo(`addRenderingMedia() - using ${targetKey}`)
    console.log(renderSettings)
    return targetKey
  }

  const sendMeshToDesktop = () => {
    const mesh = geometry.getMesh()
    if (!mesh) {
      send("local:mobile:mesh:log", `No mesh!`)
      setTimeout(() => {
        send("local:mobile:mesh", mesh)
      }, 3000)
    } else {
      send("local:mobile:mesh", mesh)
    }
  }

  const isPaired = () => !!mobilePeer.id

  const pairedWithDesktop = () => {
    sendMeshToDesktop()
    accelerometer.handleOrientation()
  }

  const pairedWithModel = el => {
    mobilePeer.el = el
    mobilePeer.isReady = true
    mobilePeer.targetKey = addRenderingMedia(
      mobilePeer.el,
      "mainVideo"
    )
  }

  const send = (msg, payload) => webrtc.sendToAll(msg, payload)
  const sendChannel = (msg, payload) =>
    webrtc.sendDirectlyToAll(state.room.id, msg, payload)

  const sendDimentions = () => {
    send(M_SCREEN_SIZE, {
      width: window.innerWidth,
      height: window.innerHeight,
    })
    send(M_SCREEN_ORIEN, screen.orientation)
  }

  const secretHandshake = () => {
    console.log(`Sent local:mobile:handshake ${mobilePeer.secret} `)
    send("local:mobile:handshake", {
      id: mobilePeer.id,
      uuid: mobilePeer.uuid,
      secret: mobilePeer.secret,
    })
  }

  function addListeners() {
    webrtc.on("createdPeer", peer => {
      console.log("Found peer!")
      peers.add(peer)
      send("local:mobile:hello", {
        id: peer.id,
      })
      if (Gui.roomDetails.members >= 1) {
        //        createCanvasStream()
      }
    })

    webrtc.on("leftRoom", roomId => {
      console.log("Left the room")
    })

    webrtc.on("peerRemoved", peer => {
      console.log(`${peer.id} left`)
      peers.delete(peer)
      if (mobilePeer.id === peer.id) {
        mobilePeer.id = null
        mobilePeer.secret = null
        mobilePeer.uuid = null
        mobilePeer.peer = null
      }
    })

    webrtc.on("videoAdded", function(video, peer) {
      video.setAttribute("crossorigin", "anonymous")
      video.setAttribute("autoplay", true)
      video.setAttribute("playsinline", "")
      video.style.display = "none"
      pairedWithModel(video)
    })

    webrtc.connection.on("message", function(data) {
      switch (data.type) {
        case "local:desktop:handshake": {
          const { secret, uuid } = data.payload
          logInfo(`From ${data.from}`)
          console.log(
            `Got handhsake from ${data.from} with secret: ${data.payload}`
          )
          console.log(
            `The current saved secret is: ${desktopPeer.secret}`
          )
          if (secret === desktopPeer.secret) {
            console.log(`secret matched desktopPeer.secret`)
            desktopPeer.id = data.from
            desktopPeer.uuid = uuid
            desktopPeer.peer = findPeer(peers.values(), data.from)
            sendDimentions()
            secretHandshake()
          }
          break
        }
        case "local:desktop:secret": {
          if (!desktopPeer.secret) {
            desktopPeer.id = data.from
            desktopPeer.secret = data.payload
            console.log(`Got and saved secret ${data.payload}`)
            send("local:mobile:secret:set", { id: desktopPeer.id })
            pairedWithDesktop()
          }
          break
        }
        case "local:mobile:handshake": {
          if (!mobilePeer.secret) {
            mobilePeer.id = data.from
            mobilePeer.secret = data.payload
          }
        }
        case M_SCREEN_SIZE: {
          console.log(data)
          break
        }
        case "local:desktop:joinRoom": {
          if (
            Gui.connect &&
            data.payload.secret === desktopPeer.secret
          ) {
            console.log(
              `local:desktop:joinRoom ${data.payload.roomId}`
            )
            send("local:mobile:joiningRoom", {
              secret: desktopPeer.secret,
              roomId: data.payload.roomId,
            })
            emitter.emit("webrtc:connect", data.payload)
          }
          break
        }
        case "local:desktop:request:mesh": {
          sendMeshToDesktop()
          break
        }
      }
    })
  }

  window.addEventListener("resize", () =>
    resizeCanvas(canvasEl, WIDTH, HEIGHT)
  )

  //resizeCanvas(canvasEl, WIDTH, HEIGHT)
  addListeners()

  const renderSingle = source => {
    regl.drawSingle({
      mobile: {
        source: source,
        flipX: true,
        width: WIDTH,
        height: HEIGHT,
      },
    })
  }

  const renderMulti = () => {
    regl.drawKey({
      mobile: {
        source: renderSettings.mainVideo.el,
        width: WIDTH,
        height: HEIGHT,
      },
      keyVideo: {
        source: renderSettings.keyVideo.el,
        width: WIDTH,
        height: HEIGHT,
      },
      keyColors: {
        source: canvasKey,
        format: "rgba",
        width: KEY_W,
        height: KEY_H,
      },
    })
  }

  let _timeCounter = 0
  const engine = loop(function(dt) {
    const p = performance.now()
    if (Gui.rendering) {
      if (p - _timeCounter >= FPS_I) {
        if (
          renderSettings.multi &&
          renderSettings.mainVideo.isReady &&
          renderSettings.keyVideo.isReady
        ) {
          if (
            renderSettings.mainVideo.el.readyState === 4 &&
            renderSettings.keyVideo.el.readyState === 4
          ) {
            renderMulti()
          } else if (
            renderSettings.mainVideo.el.readyState !== 4 &&
            renderSettings.keyVideo.el.readyState === 4
          ) {
            // webcam active and remote desktop not
            renderSingle(renderSettings.keyVideo.el)
          }
        } else if (renderSettings.single && !renderSettings.multi) {
          const source =
            renderSettings.mainVideo.el || renderSettings.keyVideo.el
            postMsg(`${source.readyState} ${source.targetKey}`)
          if (source) {
            if (source.readyState === 4) {
              renderSingle(source)
            }
          }
        }

        if (Gui.recording) {
          record.addFrame(regl.read())
        }

        _timeCounter = p
      }
    }
  })

  Gui.rendering = true
  engine.start()



  const addKeyColor = color => {
    keyColors.push(color)
    keyColors.shift()

    console.log(color)

    AppEmitter.emit("local:addKeyColor", keyColors)
    send("local:desktop:addKeyColors", keyColors)

    var id = keyCtx.createImageData(KEY_W, KEY_H)

    for (var x = 0; x < id.width; x++) {
      const k = Math.floor(x / id.width * keyColors.length)
      for (var y = 0; y < id.height; y++) {
        var index = (y * id.width + x) * 4
        id.data[index] = keyColors[k][0]
        id.data[index + 1] = keyColors[k][1]
        id.data[index + 2] = keyColors[k][2]
        id.data[index + 3] = 255
      }
    }

    keyCtx.putImageData(id, 0, 0)
  }

  AppEmitter.on("addKeyColor", ({ color }) => addKeyColor(color))

  Gui.on("disconnect", v => {
    if (v) {
      engine.stop()
      stopPairedMobile()
      logInfo("desktop: Disconnected")
    }
  })

  Gui.on("connect", v => {
    if (v && !QS.parse(location.search).norender) {
      Gui.rendering = true
      engine.start()
      logInfo("desktop: Connected")
    }
  })

  return {}
}

export default Mobile
