var Nanocomponent = require("nanocomponent")
var html = require("bel")
import { isObject } from "lodash"

class InnerComponent extends Nanocomponent {

  createElement(text) {
    this.text = text
    return this.text
  }

  update(text){
    this.text = text
    return true
  }
}

class Component extends Nanocomponent {
  constructor() {
    super()
    this._inner = new InnerComponent()
  }

  createElement(text, classes = "", cb = {}) {
    if (isObject(classes)) {
      this._cb = classes
    } else {
      this._cb = cb
    }
    this.classes = classes
    this.text = text
    return html`
    <div class="${isObject(this.classes) ? null : this.classes}">
      ${this._inner.render(this.text)}
    </div>
    `
  }

  update(text) {
    this._inner.render(text)
    return false
  }

  load(el) {
    if (this._cb.onload) {
      this._cb.onload()
      this._cb = null
    }
  }

  unload() {
    console.log("Not in dom")
  }
}

module.exports = Component
