import "whatwg-fetch"
import { SERVER_URL } from "./index"

const Upload = (() => {
  function start(blob) {
    /*  var movVideo = {
      type: "video/quicktime",
      name: "something.mov",
    }*/

    // The Javascript
    /*
    var oReq = new XMLHttpRequest();
oReq.open("POST", url, true);
oReq.onload = function (oEvent) {
  // Uploaded.
};

var blob = new Blob(['abc123'], {type: 'text/plain'});

oReq.send(blob);

    var fileInput = document.createElement("input")
    fileInput.setAttribute("type","file")
    var file = fileInput.files[0]
    var formData = new FormData()
    formData.append("file", file)

    var body = new FormData()
    body.append("video", movVideo)
    body.append("title", "A beautiful video!")
*/
    var formData = new FormData()
    formData.append("video", blob)

    return fetch(`${SERVER_URL}upload`, {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: formData,
    })
      .then(response => response.json())
      .then(responseJson => {
        console.log(responseJson)
        return responseJson
      })
  }

  return {
    start,
  }
})()

export default Upload
