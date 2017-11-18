import quad from "quads"
import cylinder from "primitive-cylinder"
const Geometry = () => {
  let _geo = []
  let _started

  function start(argument) {
    // body...
    _started = true
  }
  function stop(argument) {
    _started = false
    const mesh = cylinder(0.7, 0.7, 2, 6, _geo.length-1, _geo)
    //cylinder(0.7, 0.7, 2, 6, points.length-1, points)
    _geo.length = 0
    return mesh
  }

  function push(quat) {
    //if (!_started) return
    _geo.push(quat)
  }

  return {
    geo: _geo,
    push,
    start,
    stop,
  }
}

export default Geometry
