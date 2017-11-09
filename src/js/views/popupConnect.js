const html = require('choo/html')

module.exports = (state, emit) => {
  if(!state.peerConnected) return null

    const onclick = ()=>{
    }

  return html `
        <button
        onclick=${onclick}
        >
            Connect to: ${state.peerConnected}
        </button>
      `
}
