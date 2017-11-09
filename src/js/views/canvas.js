const html = require('choo/html')
import Config from '../config'

module.exports = (state, emit) => {

  if (!state.peerConnected) return null

  const onload = (el) => {
    el.width = 200;
    el.height = 200;
    const ctx = el.getContext('2d')
    ctx.fillStyle = '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    ctx.fillRect(0, 0, el.width, el.height);
    emit('set:ctx', ctx)
  }

  let uploadFile;
  const onFile = (el) => {
    const { target } = el
    uploadFile = target.files[0]
  }

  const sendData = () => {
    var XHR = new XMLHttpRequest();
    var FD = new FormData();
    console.log(uploadFile);
    FD.append("image", uploadFile);
    FD.append("data", JSON.stringify({id:Config.id, peerId: state.peerConnected}));
    XHR.open('POST', `${Config.host}upload`);
    XHR.send(FD);
  }

  return html `
        <div class="connected">
        <input type="file" onchange=${onFile} name="sampleFile" />
        <button onclick=${sendData}>Send</button>
        <canvas
        class="drawing-canvas"
        onload=${onload}
        >
        </canvas>
        </div>
      `
}
