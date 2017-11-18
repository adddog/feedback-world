import { FAR_Z } from "./constants"
import mat4 from "gl-mat4"
const ReglGeometryActions = (() => {
  const _ACTIONS = {
    fly: [],
  }

  function update() {
    for (var i = _ACTIONS.fly.length - 1; i >= 0; i--) {
      let g = _ACTIONS.fly[i]
      mat4.translate(g.modelM, g.modelM, [0, 0, 0.08])
      g.geo.draw({ ...g.props, model: g.modelM })
      if (g.modelM[14] > 0) {
        _ACTIONS.fly.splice(i, 1)
        g = null
      }
    }
  }

  function add(geo, type, props) {
    const modelM = mat4.create([0, 0, 0])
    mat4.translate(modelM, modelM, [
      (props.position.x * 2 - 1) * FAR_Z / 2,
      props.position.y * -1 * 2 - 1 * FAR_Z / 2,
      -FAR_Z,
    ])
    _ACTIONS[type].push({
      geo,
      props,
      modelM,
    })
  }

  return {
    update,
    add,
  }
})()

export default ReglGeometryActions
