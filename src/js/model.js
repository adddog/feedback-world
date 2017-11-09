export default (state, emitter) => {

  emitter.on('peer:found', (id) => {
    state.peerFound = id
    emitter.emit('render')
  })

  emitter.on('peer:connect:requested', (id) => {
    if(state.peerRequest) return
    state.peerRequest = id
    emitter.emit('render')
  })

  emitter.on('peer:connect:accepted', (id) => {
    if(state.peerConnected) return
    state.peerRequest = id
    state.peerConnected = id
    emitter.emit('render')
  })

  emitter.on('set:ctx', (ctx) => {
    state.ctx = ctx
  })

  emitter.on('add:image', (buffer) => {
    state.images.push(buffer)
    emitter.emit('render')
  })

  state.peerFound = null
  state.peerRequest = null
  state.peerConnected = null
  state.ctx = null
  state.images = [
  ]

  emitter.emit('render')
}
