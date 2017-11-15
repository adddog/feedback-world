import { SERVER_URL, IS_DESKTOP } from "./common"
import Gui from "./common/gui"
import objectPool from "usfl/object-pool"

function cb(data) {
  return data
}

class Socket {
  constructor() {
    this._cbPool = {}
  }

  set socket(s) {
    this._socket = s

    this._socket.on("connect", id => {
      /*this.createRoom({
        roomId: Gui.state.room.id.length ? Gui.state.room.id : null,
      })*/
    })

    this._socket.on("handshake", roomId => {
      this.emitter.emit("set:roomId", roomId)
    })

    this._socket.on("event", data => {
      console.log(data)
    })

    this._socket.on("disconnect", () => {})
  }

  set emiter(e) {
    this._emitter = e
  }

  get emiter() {
    return this._emitter
  }

  get socket() {
    return this._socket
  }

  on(str, cb) {
    this._socket.on(str, cb)
  }

  emit(event, data, cb) {
    if (cb) {
      this._cbPool[event] = data => {
        this._socket.off(event, this._cbPool[event])
        cb(data)
      }
      this._socket.on(event, this._cbPool[event])
    }
    this._socket.emit(event, data)
  }

  createRoom({ roomId }) {
    if (!roomId) return
    this.emit("room:create", {
      id: this._socket.id,
      desktop: IS_DESKTOP,
      roomId: roomId,
    })
  }

  shareThumbnail(data){
    console.log(data);
    this.emit("room:thumbnail", data)
  }
}
export default new Socket()
