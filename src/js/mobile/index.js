import Gui from "../common/gui"
import Geometry from "./geometry"
import Interaction from "./interaction"
import Accelerometer from "../common/accelerometer"
import {
  ALPHA_SENS,
  M_SCREEN_ORIEN,
  M_DEVICE_ORIEN,
  M_DEVICE_MOTION,
  M_SCREEN_SIZE,
  logError,
  logInfo,
  logSuccess,
  findPeer,
} from "../common"

const Mobile = (webrtc, state, emitter) => {
  if (Detector.isDesktop) return

  const peers = new Set()

  const desktopPeer = {
    id: null,
    peer: null,
    secret: null,
  }

  const roomEl = document.body.querySelector(".room")

  const videoEl = document.getElementById("localVideo")
  videoEl.style.display = "none"

  const remoteVideoEl = document.getElementById("remoteVideos")
  remoteVideoEl.style.display = "none"

  const interaction = Interaction(webrtc)
  const accelerometer = Accelerometer()
  const geometry = Geometry()
  geometry.start()

  let _a = 0
  let _i = setInterval(() => {
    /*accelerometer.handleMovment({
      alpha: _a,
      beta: 90,
      gamma: 0,
    })
    _a += 1*/
  }, 20)

  accelerometer.on("devicemotion", state => {
    //send(M_DEVICE_MOTION, state)
  })

  accelerometer.on("rotationvector", data => {
    console.log(data)
    data[0] += geometry.geo.length * 0.1
    data[1] += Math.sin(geometry.geo.length * 0.1) * 0.5
    //data[2]= 0.5
    geometry.push(data)
  })

  accelerometer.on("deviceorientation", state => {
    if (state.landscape) {
      state.alpha = -1 * state.alpha / ALPHA_SENS
    }
    send(M_DEVICE_ORIEN, state)
  })

  accelerometer.on("orientationchange", state => {
    //send(M_SCREEN_ORIEN, state)
  })

  const pairedWithDesktop = () => {
    setTimeout(() => {
      const g = geometry.stop()
      console.log(g)
      send("local:mobile:mesh", g)
      clearInterval(_i)
    }, 6000)
  }

  const send = (msg, payload) => webrtc.sendToAll(msg, payload)
  const sendChannel = (msg, payload) =>
    webrtc.sendDirectlyToAll(state.room.id, msg, payload)

  const sendDimentions = () => {
    send(M_SCREEN_SIZE, {
      width: window.innerWidth,
      height: window.innerHeight,
    })
    //send(M_SCREEN_ORIEN, screen.orientation)
  }

  const secretHandshake = () => {
    console.log(`Sent local:mobile:handshake ${desktopPeer.secret} `)
    send("local:mobile:handshake", {
      id: desktopPeer.id,
      uuid: desktopPeer.uuid,
      secret: desktopPeer.secret,
    })
  }

  function addListeners() {
    webrtc.on("createdPeer", peer => {
      console.log("Found peer!")
      peers.add(peer)
      send("local:mobile:hello", {
        id: peer.id,
      })
    })

    webrtc.on("leftRoom", roomId => {
      console.log("Left the room")
    })

    webrtc.on("peerRemoved", peer => {
      console.log(`${peer.id} left`)
      peers.delete(peer)
      if (desktopPeer.id === peer.id) {
        desktopPeer.id = null
        desktopPeer.secret = null
        desktopPeer.uuid = null
        desktopPeer.peer = null
      }
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
          /*else if (secret && !desktopPeer.secret) {
            desktopPeer.id = data.from
            desktopPeer.secret = secret
            desktopPeer.peer = findPeer(peers.values(), data.from)
            console.log(
              `payload secret: ${secret} where desktopPeer secret : ${desktopPeer.secret}`
            )
            secretHandshake()
          } else {
          }*/
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
      }
    })
  }

  Gui.on("disconnect", v => {
    if (v) {
    }
  })

  Gui.on("connect", v => {
    if (v) {
    }
  })

  addListeners()

  return {}
}

export default Mobile
