import Hammer from "hammerjs"
import { cover, contain } from "intrinsic-scale"
import { WIDTH, HEIGHT } from "../common"

const MobileInteraction = webrtc => {
  const videoEl = document.getElementById("localVideo")
  const canvasOff = document.createElement("canvas")
  canvasOff.classList.add("u-full", "no-interaction")
  const ctx = canvasOff.getContext("2d")
  canvasOff.style.display = "none"

  document.body.appendChild(canvasOff)

  const hammertime = new Hammer(document.body)
  hammertime.on("tap", function(e) {
    let { width, height, x, y } = contain(
      window.innerWidth,
      window.innerHeight,
      WIDTH,
      HEIGHT
    )

    videoEl.style.display = "block"

    canvasOff.width = width
    canvasOff.height = height

    ctx.drawImage(videoEl, 0, 0, width, height)

    canvasOff.style.display = "block"

    setTimeout(() => {
      videoEl.style.display = "none"
      canvasOff.style.display = "none"
    }, 2000)

    let frame = ctx.getImageData(0, 0, width, height)

    let color = [
      frame.data[e.center.x * e.center.y * 4],
      frame.data[e.center.x * e.center.y * 4 + 1],
      frame.data[e.center.x * e.center.y * 4 + 2],
    ]

    webrtc.sendToAll("local:mobile:addKeyColor", color)
  })
}

export default MobileInteraction
