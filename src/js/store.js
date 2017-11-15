import observable from "proxy-observable"
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

const WebRTC = (store, emitter) => {
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
          video: store.useWebcam
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

    const desktop = Desktop(webrtc, store, emitter)
    const mobile = Mobile(webrtc, store, emitter)

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
      //logInfo(`Joining room ${store.room.id}`)
      //emitter.emit("webrtc:connect", { roomId: store.room.id })
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
      Socket.emit("room:leave", { roomId: store.room.id })
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
      console.log(`webrtc:connect ${roomId}`)
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
            store.errorMsg = `Cannot join room ${roomId}`
            logError(`Cannot join room ${roomId}`)
            setTimeout(() => window.location.reload(), 1000)
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

    emitter.emit("webrtc:connect", { roomId: store.room.id })
  }

  emitter.once("view:room:onload", () => {
    init()
  })

  //return webrtc
}

function store(state, emitter) {
  state.store = observable({
    randomRoomId: QS.parse(location.search).room,

    useWebcam: Detector.isMobile ? true : false,

    room: {
      created: false,
      id: QS.parse(location.search).room || "",
      recording: false,
    },
  })

  Gui.state = state.store

  const updateRoom = obj =>
    (state.store.room = { ...state.store.room, ...obj })

  emitter.on("DOMContentLoaded", function() {})

  emitter.on("set:roomId", v => {
    state.store.randomRoomId = v
  })
  emitter.on("room:change", v => {
    updateRoom({ id: v })
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
    if (state.store.room.created) {
      emitter.emit("webrtc:connect", { roomId: state.store.room.id })
    } else {
      updateRoom({ created: true })
      emitter.emit("render")
    }
  })

  emitter.on("room:create:input", v => {
    updateRoom({ id: v })
  })

  Socket.emitter = emitter

  Socket.socket = io(SERVER_URL)

  const webrtc = WebRTC(state.store, emitter)

  Server.roomId().then(({ roomId }) => {
    state.store.randomRoomId = state.store.randomRoomId || roomId
    updateRoom({ id: state.store.randomRoomId })
  })
}

module.exports = store
