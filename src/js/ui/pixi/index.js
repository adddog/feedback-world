import "pixi.js"
import {
  WIDTH,
  KEY_COLORS_RADIUS,
  BAR_WIDTH,
  BAR_HEIGHT,
  HEIGHT,
  HEADER_HEIGHT,
  ORANGE,
  BLUE,
  WHITE,
} from "./constants"
import MixBars from "./mix-bars"
import KeyColors from "./key-colors"
import AppEmitter from "common/emitter"
import Gui from "common/gui"

const Pixi = (state, emitter, parentEl) => {
  const app = new PIXI.Application(WIDTH, HEIGHT, {
    transparent: true,
    autoStart: false,
    forceCanvas: true,
  })
  parentEl.appendChild(app.view)

  const renderer = app.renderer

  const mix = [Gui.tolerance, Gui.slope]

  parentEl.addEventListener("mousemove", e => {
    let n = (e.layerX - BAR_WIDTH / 2) / (BAR_WIDTH / 2)
    if (n < 0) {
      n = 1 - Math.abs(n)
      Gui.tolerance = mix[0] = n
    } else {
      Gui.slope = mix[1] = n
    }
    mixingBar.update(mix, {
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
      y: 0,
    })
    render()
  })

  parentEl.appendChild(renderer.view)

  const recordBar = new MixBars(app.stage, renderer)
  const mixingBar = new MixBars(app.stage, renderer)
  const keyColors = new KeyColors(app.stage, renderer)
  const keyColorsRemote = new KeyColors(app.stage, renderer)
  const mixingBarRemote = new MixBars(app.stage, renderer)

  const render = () => app.renderer.render(app.stage)

  const updateRecordBar = p => {
    // set a fill and a line style again and draw a rectangle
    recordBar.clear()
    recordBar.beginFill(ORANGE, 1)
    recordBar.drawRect(0, HEIGHT - 10, WIDTH * p, 10)
    recordBar.endFill()

    renderer.render(recordBar)
  }

  Gui.on("recordProgress", v => updateRecordBar(v))
  Gui.on("remoteDesktopGL", ({ tolerance, slope }) => {
    mixingBarRemote.update([tolerance, slope], {
      width: BAR_WIDTH,
      height: BAR_HEIGHT * 0.5,
      y: BAR_HEIGHT + 3,
      alpha: 0.7,
    })
    render()
  })

  AppEmitter.on("local:addKeyColor", colors => {
    keyColors.update(colors, {
      x: KEY_COLORS_RADIUS,
      y: BAR_HEIGHT * 2 + KEY_COLORS_RADIUS ,
      radius: KEY_COLORS_RADIUS,
    })
    render()
  })

  AppEmitter.on("remote:addKeyColor", colors => {
    keyColorsRemote.update(colors, {
      x: WIDTH - KEY_COLORS_RADIUS,
      y: BAR_HEIGHT * 2 + KEY_COLORS_RADIUS ,
      radius: KEY_COLORS_RADIUS,
      alpha: 0.7
    })
    render()
  })

  return {
    stage: app.stage,
    renderer,
  }
}

export default Pixi
