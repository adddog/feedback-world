import quad from "quads"
import cylinder from "primitive-cylinder"
import { Z_AMP, Y_AMP } from "threed/constants"
const MAX_POINTS = 500
const FPS = 1000 / 9
const Z = 2
const DEPTH = 2
const HEIGHT = 0.1

const Geometry = () => {
  let _geo = []
  let _t = 0
  let _state = {
    x: 0,
    y: 0,
    z: 0,
  }

  function getMesh() {
    if (_geo.length < 5) return null
    const mesh = cylinder(5, 5, 2, 6, _geo.length - 1, _geo)
    _geo.length = 0
    return mesh
  }

  function setAcceleration(state) {
    _state = state
  }

  function push(data) {
    data[0] +=
      0.2 * _geo.length * Math.min(Math.abs(_state.z), 1) * DEPTH
    data[1] *= Y_AMP +  _state.y //Math.sin(_geo.length * HEIGHT) * 0.5
    data[2] *= Z_AMP +  _state.x //Math.sin(_geo.length * HEIGHT) * 0.5
    _geo.push(data)
    if (_geo.length > MAX_POINTS) {
      _geo.length = 0
    }
  }

  return {
    geo: _geo,
    setAcceleration,
    push,
    getMesh,
  }
}

export default Geometry
