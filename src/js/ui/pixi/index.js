import "pixi.js"
import {
  WIDTH,
  HEIGHT,
  HEADER_HEIGHT,
  ORANGE,
  BLUE,
  WHITE,
} from "./constants"
import Peers from "./peers"
import AppEmitter from "common/emitter"
import Gui from "common/gui"

const Pixi = (state, emitter, parentEl) => {
  const stage = new PIXI.Container()

  const renderer = new PIXI.CanvasRenderer({
    width: WIDTH,
    height: HEIGHT,
    transparent: true,
  })

  const mix = [Gui.tolerance, Gui.slope]

  parentEl.addEventListener("mousemove", e => {
    let n = (e.layerX - WIDTH / 2) / (WIDTH / 2)
    if (n < 0) {
      n = 1 - Math.abs(n)
      Gui.tolerance = mix[0] = n
    }else{
      Gui.slope = mix[1] = n
    }
    drawMixingBars(mix)
  })

  parentEl.appendChild(renderer.view)

  const recordBar = new PIXI.Graphics()
  const mixingBar = new PIXI.Graphics()

  stage.addChild(recordBar)
  stage.addChild(mixingBar)

  const updateRecordBar = p => {
    // set a fill and a line style again and draw a rectangle
    recordBar.clear()
    recordBar.beginFill(ORANGE, 1)
    recordBar.drawRect(0, HEIGHT - 10, WIDTH * p, 10)
    recordBar.endFill()

    renderer.render(recordBar)
  }

  const drawMixingBars = vals => {
    mixingBar.clear()
    mixingBar.beginFill(WHITE, 1)
    mixingBar.drawRect(0, 0, WIDTH / 2 * vals[0], 20)
    mixingBar.endFill()
    mixingBar.beginFill(BLUE, 1)
    mixingBar.drawRect(WIDTH / 2, 0, WIDTH / 2 * vals[1], 20)
    mixingBar.endFill()
    mixingBar.moveTo(0, 0)
    mixingBar.lineStyle(1, BLUE, 1)
    mixingBar.lineTo(WIDTH, 0)
    mixingBar.lineTo(WIDTH, HEIGHT)
    mixingBar.lineTo(0, HEIGHT)
    mixingBar.lineTo(0, 0)

    renderer.render(mixingBar)
  }

  setInterval(() => {
    //drawMixingBars([Math.random(), Math.random()])
    //updateRecordBar(Math.random())
  }, 200)

  /*AppEmitter.on("mousemove", ({ y }) => {
    if (y > HEIGHT - HEADER_HEIGHT) {
      parentEl.classList.remove("no-interaction")
    } else {
      parentEl.classList.add("no-interaction")
    }
  })*/

  Gui.on("recordProgress", v => updateRecordBar(v))

  //const peerGraphics = Peers(state, emitter, {stage, renderer})

  return {
    stage,
    renderer,
  }
}

export default Pixi
