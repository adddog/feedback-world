var Nanocomponent = require("nanocomponent")
var html = require("bel")
import { isObject } from "lodash"

class InnerComponent extends Nanocomponent {
  createElement(text) {
    this.text = text
    return this.text
  }

  update(text) {
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
    this._cb = this._cb
    if (isObject(classes)) {
      this._cb = classes
    } else {
      this._cb = cb
    }
    console.log(this._cb);
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
      this._cb.onload(this.element)
    }
  }

  unload() {
      if (this._cb.unload) {
        this._cb.unload()
        this._cb = null
      }
  }
}

module.exports = Component
