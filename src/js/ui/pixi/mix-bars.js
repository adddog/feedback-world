import "pixi.js"

import { BLUE, WHITE } from "./constants"

export default class MixBars {
  constructor(stage) {
    this.gfx = new PIXI.Graphics()
    stage.addChild(this.gfx)
  }

  update(
    vals,
    {
      c1 = WHITE,
      c2 = BLUE,
      alpha = 1,
      width = 10,
      height = 10,
      y = 0,
    }
  ) {
    this.gfx.clear()
    this.gfx.beginFill(c1, alpha)
    this.gfx.drawRect(0, y, width / 2 * vals[0], height)
    this.gfx.endFill()
    this.gfx.beginFill(c2, alpha)
    this.gfx.drawRect(width / 2, y, width / 2 * vals[1], height)
    this.gfx.endFill()
  }
}
