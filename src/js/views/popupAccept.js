const html = require('choo/html')

module.exports = (state, emit) => {
  if(!state.peerRequest || state.peerConnected) return null

    const onclick = ()=>{
      emit('peer:connect:accepted', state.peerRequest)
    }

  return html `
        <button
        onclick=${onclick}
        >
            ${state.peerRequest} is wants to connect
        </button>
      `
}
