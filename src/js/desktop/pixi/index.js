import "pixi.js"
import {HEADER_HEIGHT,ORANGE} from './constants'
import Peers from "./peers"
import AppEmitter from "../../common/emitter"
import Gui from "../../common/gui"

const Pixi = (state, emitter, parentEl) => {
  const stage = new PIXI.Container()

  const renderer = new PIXI.CanvasRenderer({
    width:window.innerWidth,
    height:window.innerHeight,
    transparent: true,
    autoResize: true,
  })

  parentEl.classList.add('u-full', 'no-interaction')
  parentEl.appendChild(renderer.view)

  const recordBar = new PIXI.Graphics()

  stage.addChild(recordBar)

  window.addEventListener("resize", () => {
    renderer.resize(window.innerWidth, window.innerHeight)
  })

  const updateRecordBar = p => {
    // set a fill and a line style again and draw a rectangle
    recordBar.clear()
    recordBar.beginFill(ORANGE, 1)
    recordBar.drawRect(
      0,
      window.innerHeight - 10,
      window.innerWidth * p,
      10
    )
    recordBar.endFill()

    renderer.render(recordBar)
  }

  AppEmitter.on("mousemove", ({y})=>{
    if(y > window.innerHeight - HEADER_HEIGHT){
      parentEl.classList.remove('no-interaction')
    }else{
      parentEl.classList.add('no-interaction')
    }
  })

  Gui.on("recordProgress", v => updateRecordBar(v))

  //const peerGraphics = Peers(state, emitter, {stage, renderer})

  return {
    stage,
    renderer
  }
}

export default Pixi
