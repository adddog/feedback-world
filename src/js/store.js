import QS from "query-string"
import uuid from "uuid"
import io from "socket.io-client"
import SimpleWebRTC from "simplewebrtc"
import { colour } from "./common"
import AppEmitter from "./common/emitter"
import { connect, disconnect } from "./common/gui"
import Gui from "./common/gui"
import {
  logSuccess,
  logInfo,
  logError,
  SERVER_URL,
  WIDTH,
  IS_DESKTOP,
  FPS,
  IS_DEV,
  IS_PROD,
  HEIGHT,
} from "./common"
import Server from "./common/server"
import Socket from "./socket"
import Desktop from "./desktop"
import Mobile from "./mobile"

const WebRTC = (state, emitter) => {
  function init() {
    logSuccess("First load")

    const noCamera = QS.parse(location.search).noc

    const videoSettings = {
      width: { max: WIDTH },
      height: { max: HEIGHT },
      frameRate: { max: FPS },
    }

    const webrtc = new SimpleWebRTC(
      {
        //url: IS_DEV ? null : SERVER_URL,
        /*socketio:{
          //path:"/ratp"
        },*/
        nick: {
          desktop: Detector.isDesktop,
          uuid: uuid.v4(),
        },
        autoRemoveVideos: true,
        autoRequestMedia: true,
        localVideoEl: "localVideo",
        remoteVideosEl: "remoteVideos",
        media: {
          video: state.useWebcam
            ? Detector.isDesktop
              ? noCamera ? false : { ...videoSettings }
              : noCamera
                ? false
                : {
                    ...videoSettings,
                    facingMode: "environment",
                  }
            : false,
          audio: !Detector.isDesktop,
        },
        receiveMedia: {
          offerToReceiveAudio: Detector.isDesktop,
          offerToReceiveVideo: Detector.isDesktop,
        },
        offerToReceiveAudio: Detector.isDesktop,
        offerToReceiveVideo: Detector.isDesktop,
      },
      { mirror: false }
    )

    const desktop = Desktop(webrtc, state, emitter)
    const mobile = Mobile(webrtc, state, emitter)

    webrtc.on("disconnect", function(evt) {
      console.log("Webrtc:disconnect")
      Socket.emit("room:leave")
    })

    webrtc.on("connectionReady", function(evt) {
      logInfo(`connectionReady`)
      if (IS_PROD) {
        Socket.socket = webrtc.connection.connection
      }
    })

    webrtc.on("readyToCall", function() {
      //logInfo(`Joining room ${state.room.id}`)
      //emitter.emit("webrtc:connect", { roomId: state.room.id })
    })

    /*webrtc.on("localStream", function(stream) {})

  webrtc.on("localMediaError", function(err) {})

  webrtc.on("createdPeer", function(peer) {})

  webrtc.on("localScreenAdded", function(video) {})
  // local screen removed
  webrtc.on("localScreenRemoved", function(video) {})

  webrtc.on("handlePeerStreamAdded", function(peer) {})
*/

    const leaveRoom = roomId => {
      Socket.emit("room:leave", { roomId: state.room.id })
      webrtc.leaveRoom()
    }

    const joinRoom = roomId => {
      emitter.emit("room:change", roomId)
      Socket.createRoom({ roomId })
      connect()
      webrtc.joinRoom(roomId)
    }

    emitter.on("webrtc:connect", ({ roomId }) => {
      //webrtc.stopLocalVideo()
      Socket.emit(
        "rooms:canJoin",
        { roomId, desktop: IS_DESKTOP },
        resp => {
          console.log("---------")
          console.log(resp)
          console.log("---------")
          if (resp.canJoin) {
            console.log("Gui.connected", Gui.connect)
            if (Gui.connect) {
              disconnect()
              leaveRoom(roomId)
            }
            connect()
            joinRoom(roomId)
          } else {
            logError(`Cannot join room ${roomId}`)
          }
        }
      )

      /*

        PASS THE SECRET TO THE MOBILE SO IT KNOWS TO CHANGE ROOMS
        MOBILE CHANGES TO NEW ROOM

      */

      if (Gui.started) return
      Gui.started = true
    })
    emitter.emit("webrtc:connect", { roomId: state.room.id })
  }

  emitter.once("view:room:onload", () => {
    init()
  })

  //return webrtc
}

module.exports = store

function store(state, emitter) {
  state.randomRoomId = QS.parse(location.search).room

  state.useWebcam = Detector.isMobile ? true : false

  state.room = {
    created: false,
    id: "",
    recording: false,
  }

  Gui.state = state

  emitter.on("DOMContentLoaded", function() {
    // CRUD
  })

  emitter.on("set:roomId", v => {
    state.randomRoomId = v
  })
  emitter.on("room:change", v => {
    state.room.id = v
    //emitter.emit("render")
  })

  emitter.on("state:usewebcam", v => {
    state.useWebcam = v
  })

  /*emitter.on("set:socket", s => {
    state.socket = Socket(s.connection)
    logInfo("Set socket")
  })*/

  emitter.on("room:create", roomId => {
    state.room.id = roomId
    if (state.room.created) {
      emitter.emit("webrtc:connect", { roomId: roomId })
    } else {
      emitter.emit("render")
    }
    state.room.created = true
  })

  emitter.on("room:create:input", v => {
    state.room.id = v
    emitter.emit("render")
  })

  Server.roomId().then(({ roomId }) => {
    state.randomRoomId = state.randomRoomId || roomId
    emitter.emit("render")
  })

  Socket.emitter = emitter

  Socket.socket = io(SERVER_URL)

  const webrtc = WebRTC(state, emitter)
}

export default WebRTC
