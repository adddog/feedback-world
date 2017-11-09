const html = require('choo/html')

module.exports = (state, emit) => {
  if(!state.peerFound || state.peerConnected) return null

    const onclick = ()=>{
      emit('peer:connect', state.peerFound)
    }

  return html `
        <button
        onclick=${onclick}
        >
            Connect to: ${state.peerFound}
        </button>
      `
}
