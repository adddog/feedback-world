var Recorder = (stream, options) => {
  var chunks = []
  var count = 0
  let _cb
  let mediaRecorder = new MediaRecorder(stream, {
    mimeType: `${options.type}`,
  })

  function log(message) {
    console.warn(message)
  }

  mediaRecorder.ondataavailable = function(e) {
    chunks.push(e.data)
  }

  mediaRecorder.onerror = function(e) {
    log("Error: " + e)
    console.log("Error: ", e)
  }

  mediaRecorder.onstart = function() {
    log("Started & state = " + mediaRecorder.state)
  }

  mediaRecorder.onstop = function() {
    log("Stopped  & state = " + mediaRecorder.state)

    var blob = new Blob(chunks, {
      type: `${options.type}`,
    })
    var videoElement = document.createElement("audio")
    videoElement.src = URL.createObjectURL(blob)
    document.body.appendChild(videoElement)
    videoElement.play()
    chunks = []

    _cb(blob)
  }

  mediaRecorder.onpause = function() {
    log("Paused & state = " + mediaRecorder.state)
  }

  mediaRecorder.onresume = function() {
    log("Resumed  & state = " + mediaRecorder.state)
  }

  mediaRecorder.onwarning = function(e) {
    log("Warning: " + e)
  }

  function stop(cb) {
    _cb = cb
    if(mediaRecorder.state === "recording"){
      mediaRecorder.stop()
    }
    //mediaRecorder.requestData()
  }

  function start(argument) {
    mediaRecorder.start(0)
  }

  return {
    start,
    stop,
  }
}

export default Recorder
