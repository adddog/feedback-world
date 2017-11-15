import { IS_DEV, WIDTH, HEIGHT } from "./common"
import Whammy from "./lib/Whammy"
import Adapter from "webrtc-adapter"
import Model from "./model"
import { find } from "lodash"
import SimpleWebRTC from "simplewebrtc"

require("fastclick")(document.body)

const html = require("choo/html")
const choo = require("choo")

var app = choo()

if (IS_DEV) {
  app.use(require("choo-devtools")())
}

app.use(require('./store'))


const onload = el => {

}
//VIEWS

const home = require("./views/home")
const room = require("./views/room")
const ui = require("./views/ui")


function mainView(state, emit) {
  return html`
    <div
    class="app"
    onload=${onload}
    >
      ${home(state, emit)}
      ${room(state, emit)}
      ${ui(state, emit, app.emitter)}
    </div>
  `
}


app.route(`/*`, mainView)

var tree = app.start()
document.body.appendChild(tree)
