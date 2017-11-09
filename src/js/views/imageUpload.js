const html = require('choo/html')
import Config from '../config'

module.exports = (state, emit) => {

  if (!state.peerConnected) return null

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
        <div class="image-upload">
        <input type="file" onchange=${onFile} name="sampleFile" />
        <button onclick=${sendData}>Send</button>
        </div>
      `
}
