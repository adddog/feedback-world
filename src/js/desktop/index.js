import uuid from "uuid"
import sono from "sono"
import Socket from "../socket"
import Regl from "./regl"
import DesktopInteraction from "./interaction"
import AppEmitter from "../common/emitter"
import MSRecorder from "./mediaStreamRecorder"
import Instagram from "./instagram"
import Webcam from "./webcam"
import Record from "./record"
import Recorder from "./soundRecorder"
import Sound from "./sound"
import Gui from "../common/gui"
import Server from "../common/server"
import { find, map, filter, flatten, compact } from "lodash"
import { cover, contain } from "intrinsic-scale"
import loop from "raf-loop"
import {
  IS_MOBILE,
  IS_DEV,
  M_SCREEN_ORIEN,
  M_DEVICE_MOTION,
  M_DEVICE_ORIEN,
  M_SCREEN_SIZE,
  WIDTH,
  HEIGHT,
  KEY_W,
  KEY_H,
  ALPHA_SENS,
  AUDIO_EXP,
  AUDIO_EXP_TYPE,
  RECORD_FRAMES_DELAY,
  FPS,
  FPS_I,
  hasPeer,
  findPeer,
  numberDesktops,
  logError,
  logInfo,
  logSuccess,
  postMsg,
  createVideoElFromStream,
} from "../common"

const Desktop = (webrtc, state, emitter) => {
  if (IS_MOBILE) return

  const peers = new Set()
  const peerIds = new Map()

  const localData = {
    id: null,
    uuid: webrtc.config.nick.uuid,
  }

  const keyVideo = {
    isReady: false,
    el: null,
  }
  let pairedMobile = {
    el: null,
    secret: null,
    id: null,
    peer: null,
    engaged: false,
    isReady: false,
  }
  const keyColors = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]
  let isReady = false
  let _timeCounter = 0

  const videoEl = document.getElementById("localVideo")
  videoEl.setAttribute("muted", true)
  if (state.useWebcam) {
    videoEl.addEventListener("loadeddata", () => {
      logInfo(`local video ready`)
      setVideoToKey(videoEl)
    })
  }

  const remoteVideoEl = document.getElementById("remoteVideos")
  videoEl.style.display = "none"
  remoteVideoEl.style.display = "none"

  const roomEl = document.body.querySelector(".room")
  const canvasEl = document.getElementById("c_output")
  canvasEl.width = WIDTH
  canvasEl.height = HEIGHT

  const canvasKey = document.createElement("canvas")
  canvasKey.width = KEY_W
  canvasKey.height = KEY_H

  if (IS_DEV) {
    //canvasKey.classList.add("canvas")
    //document.body.appendChild(canvasKey)
  }
  const reset = () => {
    interaction.removeKeyboardCommunication()
    localVideo.isReady = false
    isReady = false
    pairedMobile.engaged = false
    pairedMobile.isReady = false
    pairedMobile.id = null
    pairedMobile.secret = null
    pairedMobile.uuid = null
    pairedMobile.peer = null
  }

  const keyCtx = canvasKey.getContext("2d")

  const regl = Regl(canvasEl)
  const interaction = DesktopInteraction(webrtc, canvasEl)
  interaction.setOnFileDropped(urlBlob => {
    const video = document.createElement("video")
    video.setAttribute("autoplay", "true")
    video.setAttribute("crossorigin", "anonymous")
    video.setAttribute("muted", true)
    video.src = urlBlob
    setVideoToKey(video)
  })
  const webcam = Webcam(webrtc)
  const instagram = Instagram(videoEl)
  const sound = Sound()
  const record = Record()

  const send = (msg, payload) => webrtc.sendToAll(msg, payload)
  const sendChannel = (msg, payload) =>
    webrtc.sendDirectlyToAll(state.room.id, msg, payload)

  //****************
  // INIT
  //****************

  const tryStarting = peerValues => {
    console.log(`tryStarting: pairedMobile.id: ${pairedMobile.id} pairedMobile.isReady: ${pairedMobile.isReady}`);
    if (
      pairedMobile.id &&
      !pairedMobile.isReady &&
      !pairedMobile.engaged
    ) {
      console.log(`${peerValues.size} peers`)
      for (let peer of peerValues) {
        if (pairedMobile.id === peer.id) {
          console.log(
            `pairedMobile id ${pairedMobile.id} === peer id ${peer.id}`
          )
          pairedMobile.peer = peer

          if (!pairedMobile.secret) {
            pairedMobile.secret = uuid.v4()
            Gui.secret = pairedMobile.secret
            send("local:desktop:secret", pairedMobile.secret)
            logInfo(
              `Created and sent new secret ${pairedMobile.secret}`
            )
          }

          if (!pairedMobile.peer.videoEl) return

          pairedMobile.engaged = true

          logInfo(`pairedMobile videoEl ready`)

          pairedMobile.el = pairedMobile.peer.videoEl

          function _onProgress() {
            setPairedMobileReady()
            postMsg(`connected with your phone`)
            logSuccess(`localMobile playing!`)
            pairedMobile.peer.videoEl.removeEventListener(
              "progress",
              _onProgress
            )
          }

          pairedMobile.peer.videoEl.addEventListener(
            "progress",
            _onProgress
          )

          sound.init(peer.stream)
          logSuccess(`Start!`)
        } else {
          /*peer.stream.getVideoTracks().forEach(s => s.stop())
          peer.stream.getAudioTracks().forEach(s => s.stop())
          peer.videoEl.stop()
          peer.videoEl.style.display = "none"*/
        }
      }
    }
  }

  const isPlayingMedia = () =>
    keyVideo.isReady || pairedMobile.isReady

  const createCanvasStream = () => {
    const stream = canvasEl.captureStream(FPS)
    webrtc.webrtc.localStreams.unshift(stream)
    /*const v = document.createElement("video")
    v.width = WIDTH
    v.height = HEIGHT
    v.srcObject = stream
    v.classList.add("canvas")
    document.body.appendChild(v)*/
  }

  const cancelStream = stream => {
    if (!stream) return
    stream.getTracks().forEach(track => track.stop())
  }

  const cancelStreamFromPeer = peer => {
    if (!peer) return
    if (!peer.stream) return
    cancelStream(peer.stream)
  }

  const stopKeyVideo = () => (keyVideo.isReady = false)

  const setPairedMobileReady = () => {
    pairedMobile.isReady = true
  }

  const setVideoToKey = el => {
    keyVideo.el = el
    keyVideo.isReady = true
    logSuccess(`keyVideo.isReady ${true}`)
  }

  const connectToOtherDesktop = peer => {
    if (!peer) return
  }

  const addKeyColor = color => {
    keyColors.push(color)
    keyColors.shift()

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

  //**************
  //**** MESSAGED
  //**************

  function addListeners() {
    webrtc.connection.on("message", function(data) {
      switch (data.type) {
        /*
        from other desktops
        */
        case "local:desktop:handshake": {
          const { secret, id, isPlayingMedia } = data.payload
          console.log(
            `Got desktop handshake from  ${data.from} mobile secret: ${secret}`
          )
          if (!peerIds.get(data.from)) {
            peerIds.set(data.from, {
              desktop: true,
              isPlayingMedia: isPlayingMedia,
              id: data.from,
            })
          }

          const numDesktops = numberDesktops(peerIds.values())
          logInfo(`numDesktops ${numDesktops}`)


          interaction.addKeyboardCommunication()

          if (numDesktops >= 1 && pairedMobile.id) {
            connectToOtherDesktop(findPeer(peers.values(), data.from))
          }

          break
        }
        /*
        createdPeer() on mobile sends
        */
        case "local:mobile:hello": {
          localData.id = data.payload.id
          logSuccess(`Your peer id is ${localData.id}`)
          sendHandshake()
          break
        }
        /*
        mobile gets handshake from desktop and send handshake back
        */
        case "local:mobile:handshake": {
          const { secret, id } = data.payload
          console.log(
            `Got mobile handshake from  ${data.from} with secret ${secret}`
          )
          if (!peerIds.get(data.from)) {
            peerIds.set(data.from, {
              desktop: false,
              id: data.from,
            })
          }
          if (secret && pairedMobile.secret) {
            console.log(
              `\t has payload ${secret} and local secret ${pairedMobile.secret}`
            )
            if (secret === pairedMobile.secret) {
              console.log(`\t payload secret matches local secret`)
              localData.id = id
              pairedMobile.id = data.from
              logSuccess(`localMobile peer id : ${pairedMobile.id}`)
              postMsg(`paired with your phone...`)
              tryStarting(peers.values())
            }
          } else if (!pairedMobile.secret && !secret) {
            console.log(`\t No local secret or no payload secret`)
            postMsg(`paired with your phone...`)
            pairedMobile.id = data.from
            localData.id = id
            tryStarting(peers.values())
          } else if (secret && !pairedMobile.secret) {
            logError(`Not for you! ${data.from} (mobile)`)
            peerIds.get(data.from).stopStream = true
            cancelStreamFromPeer(findPeer(peers.values(), data.from))
          } else if (!secret && pairedMobile.secret) {
            logError(`You got a partner!`)
            logSuccess(`localMobile peer id : ${pairedMobile.id}`)
          }
          break
        }
        /*
        confirmation from mobile that it is paired
        */
        case "local:mobile:secret:set":
          {
            const { id } = data.payload
            logSuccess(`Secret was set on ${data.from} by ${id}`)
            tryStarting(peers.values())
          }
          break
        /*
        confirmation from mobile that it joinging room
        */
        case "local:mobile:joiningRoom": {
          if (
            data.payload.secret === pairedMobile.secret &&
            pairedMobile.id === data.from
          ) {
            logInfo(
              `Mobile ${data.from} is joining ${data.payload
                .roomId} so joing too`
            )
            emitter.emit("webrtc:connect", {
              roomId: data.payload.roomId,
            })
          }
          break
        }

        case "local:desktop:message":{
          AppEmitter.emit("desktop:communcation:remote", data.payload)
          break
        }
        case "local:desktop:addKeyColor":
        case "local:mobile:addKeyColor": {
          addKeyColor(data.payload)
          break
        }
        case M_SCREEN_ORIEN: {
          break
        }
        case M_DEVICE_MOTION: {
          if (!Gui.rendering) return
          Gui.deviceMotion = data.payload
          Gui.echo = {
            ...Gui.echo,
            ...{ delay: Math.abs(data.payload.z) + 0.5 },
          }
          break
        }
        case M_DEVICE_ORIEN: {
          if (!Gui.rendering) return
          Gui.deviceOrien = data.payload
          if (data.payload.landscape) {
            Gui.uSaturation = Math.abs(data.payload.gamma / 90)
            Gui.panner = {
              value: data.payload.alpha,
            }
          }
          break
        }
        case M_SCREEN_SIZE: {
          break
        }
      }
    })

    logInfo("Added Listeners")
  }

  const sendHandshake = () =>
    send("local:desktop:handshake", {
      secret: pairedMobile.secret,
      isPlayingMedia: isPlayingMedia(),
      uuid: localData.uuid,
    })

  webrtc.on("createdPeer", peer => {
    console.log("Found peer!")
    peers.add(peer)

    sendHandshake()

    logInfo(`createdPeer: sent localsecret ${pairedMobile.secret}`)
  })

  webrtc.on("leftRoom", roomId => {
    reset()
    peerIds.clear()
    peers.clear()
    webrtc.stopLocalVideo()
  })

  webrtc.on("peerRemoved", peer => {
    peers.delete(peer)
    if (pairedMobile.id === peer.id) {
      reset()
    }
  })

  webrtc.on("videoRemoved", (videoEl, peer) => {})

  webrtc.on("videoAdded", function(video, peer) {
    video.setAttribute("crossorigin", "anonymous")
    video.setAttribute("muted", true)
    video.style.display = "none"

    const foundPeer = findPeer(peerIds.values(), peer.id)

    console.log(foundPeer)

    if (foundPeer && foundPeer.stopStream) {
      //mobile stream not belonging to you
      cancelStream(peer.stream)
      //video.parent.removeChild(video)
    } else if (
      foundPeer &&
      !pairedMobile.id &&
      foundPeer.desktop &&
      foundPeer.isPlayingMedia
    ) {
      postMsg(`connected to another desktop`)
      //another desktops stream
      setVideoToKey(peer.videoEl)
    } else if (
      pairedMobile.id &&
      foundPeer.desktop &&
      foundPeer.isPlayingMedia
    ) {
      postMsg(`connected with your phone`)
      //another desktops stream, you have a mobile
      console.log(peer)
      //keyVideo.el = peer.videoEl
      //console.log(peer.videoEl);

      //setVideoToKey(peer.videoEl)

      setTimeout(() => {
        setVideoToKey(peer.videoEl)
      }, 2000)
    }

    logInfo(`VideoAdded from ${peer.id}`)

    tryStarting(peers.values())
  })

  const resizeCanvas = (w = WIDTH, h = HEIGHT) => {
    let { width, height, x, y } = cover(
      window.innerWidth,
      window.innerHeight,
      w,
      h
    )
    const scale = Math.max(width / w, height / h)
    canvasEl.style.transform = `scale3d(${scale},${scale},1) translate3d(0, 0, 0)`
    canvasEl.style.webkitTransform = `scale3d(${scale},${scale},1) translate3d(0,0, 0)`
    canvasEl.style.top = `${y / 2}px`
    canvasEl.style.left = `${x / 2}px`
  }

  window.addEventListener("resize", () => resizeCanvas(WIDTH, HEIGHT))

  resizeCanvas(WIDTH, HEIGHT)

  //*************
  // RECORDING
  //*************

  const recordFinalStart = () => {
    sound.recordMasterStart()

    setTimeout(() => {
      Gui.recording = true
    }, RECORD_FRAMES_DELAY)

    emitter.emit("desktop:render:start")
  }

  const recordFinalStop = () => {
    emitter.emit("desktop:render:stop")
    if (videoEl) videoEl.pause()
    webrtc.webrtc.localStreams.forEach(cancelStream)
    webrtc.webrtc.peers.forEach(peer => cancelStream(peer.stream))
    Gui.recording = false
    Gui.rendering = false
    sono.stopAll()
    sono.destroyAll()
    sound.recordMasterStop((blob, duration) => {
      sound.destroy()
      logInfo(`audio complete, duration: ${duration}`)
      record.addAudio(blob, duration)
      record.start(canvasKey).then(video => {
        emitter.emit("desktop:render:completed")
        Server.upload(video)
          .then(uploadResp => {
            console.log(uploadResp)
            emitter.emit("desktop:render:uploaded")
          })
          .catch(err => {
            console.log(err)
          })
      })
    })
  }

  //*************
  // LOOP
  //*************

  const engine = loop(function(dt) {
    if (Gui.rendering) {
      if (performance.now() - _timeCounter >= FPS_I) {
        if (pairedMobile.isReady && !keyVideo.isReady) {
          regl.drawSingle({
            mobile: {
              source: pairedMobile.el,
              flipX: true,
              width: WIDTH,
              height: HEIGHT,
            },
          })
        } else if (pairedMobile.isReady && keyVideo.isReady) {
          regl.drawKey({
            mobile: {
              source: pairedMobile.el,
              width: WIDTH,
              height: HEIGHT,
            },
            keyVideo: {
              source: keyVideo.el,
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
        } else if (!pairedMobile.isReady && keyVideo.isReady) {
          regl.drawSingle({
            mobile: {
              source: keyVideo.el,
              width: WIDTH,
              flipX: true,
              height: HEIGHT,
            },
          })
        }

        if (Gui.recording) {
          record.addFrame(regl.read())
        }

        _timeCounter = performance.now()
      }
    }
    _timeCounter++
  })

  //DEV
  Gui.recordFinalStart = recordFinalStart
  Gui.recordFinalStop = recordFinalStop
  Gui.startWebcam = () => {}
  Gui.stopWebcam = () => {
    stopKeyVideo()
    webcam.stop(keyVideo.el)
  }
  Gui.instagram = () => {
    /*instagram
      .load(setVideoToKey)
      .then(videoEl => setVideoToKey(videoEl))*/
  }

  //*************
  // LISTRENES
  //*************

  AppEmitter.on("addKeyColor", ({ color }) => addKeyColor(color))

  AppEmitter.on("changerooms", ({ roomId }) => {
    engine.stop()
    pairedMobile.isReady = false
    if (pairedMobile.peer) {
      logInfo("sending local:desktop:joinRoom" + roomId)
      webrtc.sendToAll("local:desktop:joinRoom", {
        roomId,
        secret: pairedMobile.secret,
      })
    } else {
      emitter.emit("webrtc:connect", { roomId })
    }
  })

  AppEmitter.on("webcam:start", () => {
    webcam
      .start()
      .then(stream => {
        setVideoToKey(createVideoElFromStream(stream))
      })
      .catch(err => {})
  })

  AppEmitter.on("webcam:stop", () => {
    stopKeyVideo()
    webcam.stop(keyVideo.el)
  })

  AppEmitter.on("insta:loaded", () => {
    setVideoToKey(videoEl)
  })

  AppEmitter.on("record:final:start", () => {
    recordFinalStart()
  })

  AppEmitter.on("record:final:stop", () => {
    recordFinalStop()
  })

  AppEmitter.on("desktop:communcation", str =>
    send("local:desktop:message", str)
  )

  Gui.on("disconnect", v => {
    if (v) {
      engine.stop()
      pairedMobile.isReady = false
      logInfo("desktop: Disconnected")
    }
  })

  Gui.on("connect", v => {
    if (v) {
      Gui.rendering = true
      engine.start()
      logInfo("desktop: Connected")
    }
  })

  addListeners()
  createCanvasStream()

  return {
    addListeners,
  }
}

export default Desktop
