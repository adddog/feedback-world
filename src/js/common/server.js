import "whatwg-fetch"
import fetchJsonp from "fetch-jsonp"
import { IS_DEV, WIDTH, SERVER_URL } from "common/constants"
import AuthService from "./auth"
const PATH =
  process.env.NODE_ENV === "development" ? "" : "feedback-rtc/"

const Server = (() => {
  function upload(blob) {
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

    return fetch(`${SERVER_URL}${PATH}upload`, {
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

  window.instagramCallback = data => data

  const DEFAULT_ENDPOINT = "users"
  const DEFAULT_ORIGIN = "https://api.instagram.com"
  const DEFAULT_SIZE = 100
  const DEFAULT_VERSION = "v1"

  function insta() {
    return AuthService.auth(
      `${SERVER_URL}${PATH}login/instagram`
    ).then(d => {
      return fetchJsonp(
        `${DEFAULT_ORIGIN}/${DEFAULT_VERSION}/${DEFAULT_ENDPOINT}/${d
          .id[0]}/media/recent?access_token=${d.accessToken}&count=${DEFAULT_SIZE}`,
        {
          jsonpCallbackFunction: "instagramCallback",
        }
      ).then(response => {
        return response.json()
      })
    })
  }

  function roomId() {
    return fetch(`${SERVER_URL}${PATH}room`, {}).then(response =>
      response.json()
    )
  }

  return {
    roomId,
    upload,
    insta,
  }
})()

export default Server
