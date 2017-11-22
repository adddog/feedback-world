import "pixi.js"
import Color from "color"

import { BLUE, WHITE } from "./constants"

export default class KeyColors {
  constructor(stage) {
    this.gfx = new PIXI.Graphics()
    stage.addChild(this.gfx)
  }

  update(vals = [], { x = 0, y = 0, radius = 16, alpha = 1 } = {}) {
    this.gfx.clear()
    const a = Math.PI * 2 / vals.length
    this.gfx.beginFill(WHITE, alpha)
    this.gfx.drawCircle(x + 1, y + 1, radius)
    this.gfx.endFill()
    vals.forEach((c, i) => {
      const color = Color.rgb(c)
      this.gfx.moveTo(x, y)
      this.gfx.beginFill(color.rgbNumber(), alpha)
      this.gfx.arc(x, y, radius, i * a, (i + 1) * a)
      this.gfx.lineTo(c, y)
      this.gfx.endFill()
    })
  }
}
