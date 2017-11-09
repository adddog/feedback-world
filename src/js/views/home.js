import html from "choo/html"
var bel = require('bel');

module.exports = (state, emit) => {
  emit("log:debug", "Rendering home view")

  if (state.room.created) return null

  const createRoomInput = e => {
    var value = e.target.value
    if (!value) return
    if (e.keyCode === 13) {
      emit("room:create", value)
    } else {
      emit("room:create:input", value)
    }
  }

  const joinRoom = () => {
    emit("room:create", state.room.id)
  }

  const createRoom = e => {
    emit("room:create", state.randomRoomId)
  }

  const changeCheckbox = e => {
    emit("state:usewebcam", e.target.checked)
  }

  const tree =  bel`
    <section>
    <header class="header">
      <h1>join room</h1>
      <input class="new-todo"
        value=${state.room.id}
        autofocus
        onkeyup=${createRoomInput}
        placeholder="room name"/>
        <button class="clear-completed" onclick=${joinRoom}>
        join ${state.room.id}
      </button>
      <div><span>use webcam</span><input label="use webcam" checked=${state.useWebcam ? "checked": "false"}  type="checkbox" onchange=${changeCheckbox}></div>
      <h1>join new room ${state.randomRoomId}</h1>
       <button class="clear-completed" onclick=${createRoom} >
        create
      </button>
    </section>
  `

  //onload(tree, onLoadEl)

  return tree
}
