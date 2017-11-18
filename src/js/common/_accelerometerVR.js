import loop from "raf-loop"
import { vec3, vec4 } from "gl-matrix"

const isFunction = function(obj) {
  return typeof obj == "function" || false
}

let position = vec3.create()
let quaternion = vec4.create()

const Accelerometer = (
  props = {
    multiplier: 1,
    useGravity: false,
  }
) => {
  let state = {
    x: null,
    y: null,
    z: null,
    rotation: null,
    landscape: false,
  }

  const listeners = new Map()
  let firstTime = true
  let offset = {
    alpha: 0,
    beta: 0,
    gamma: 0,
  }

  let vrDisplay, vrDisplays

  let frameData = null

  if ("VRFrameData" in window) {
    frameData = new VRFrameData()
  }

  function gotVRDisplays(displays) {
    vrDisplays = displays
    if (displays.length > 0) {
      vrDisplay = displays[0]
    } else {
      console.warn("VR input not available.")
      emit("vrcontrols", "VR input not available.")
    }
  }

  if (navigator.getVRDisplays) {
    navigator
      .getVRDisplays()
      .then(gotVRDisplays)
      .catch(function() {
        emit(
          "vrcontrols",
          "THREE.VRControls: Unable to get VR Displays"
        )
        console.warn("THREE.VRControls: Unable to get VR Displays")
      })
  }

  const scale = 1
  const standing = false
  const userHeight = 1.6

  const handleOrientation = event => {
    const { orientation } = window
    firstTime = true
    state = {
      ...state,
      ...{ landscape: orientation === 90 || orientation === -90 },
    }
    const { landscape, rotation } = state
    emit("orientationchange", { landscape, rotation })
  }

  const handleAcceleration = event => {
    const { landscape } = state
    const { useGravity, multiplier } = props
    const acceleration = useGravity
      ? event.accelerationIncludingGravity
      : event.acceleration
    const rotation = event.rotationRate || null
    const { x, y, z } = acceleration

    state = {
      ...state,
      ...{
        rotation,
        x: (landscape ? y : x) * multiplier,
        y: (landscape ? x : y) * multiplier,
        z: z * multiplier,
      },
    }
    emit("devicemotion", state)
  }

  const handleMovment = e => {
    if (firstTime) {
      offset.alpha = e.alpha
      offset.beta = e.beta
      offset.gamma = e.gamma
      firstTime = false
      return
    }

    let alpha = e.alpha - offset.alpha
    let beta = e.beta - offset.beta
    let gamma = e.gamma - offset.gamma
    //alpha = alpha < 0 ? 360 - Math.abs(alpha) : alpha
    emit("deviceorientation", {
      alpha,
      beta,
      gamma,
      landscape: state.landscape,
    })
  }

  const destroy = () => {
    window.removeEventListener("deviceorientation", handleMovment)
    window.removeEventListener("devicemotion", handleAcceleration)
    window.removeEventListener("orientationchange", handleOrientation)
    listeners.clear()
  }

  const on = (label, callback) => {
    listeners.has(label) || listeners.set(label, [])
    listeners.get(label).push(callback)
  }

  const off = (label, callback) => {
    let funcs = listeners.get(label),
      index

    if (funcs && funcs.length) {
      index = funcs.reduce((i, listener, index) => {
        return isFunction(listener) && listener === callback
          ? (i = index)
          : i
      }, -1)

      if (index > -1) {
        funcs.splice(index, 1)
        listeners.set(label, listeners)
        return true
      }
    }
    return false
  }

  const emit = (label, ...args) => {
    let func = listeners.get(label)

    if (func && func.length) {
      func.forEach(listener => {
        listener(...args)
      })
      return true
    }
    return false
  }

  handleOrientation()
  /*window.addEventListener("deviceorientation", handleMovment)
  window.addEventListener("devicemotion", handleAcceleration)
  window.addEventListener("orientationchange", handleOrientation)*/

  const updateVr = () => {
    if (vrDisplay) {
      var pose

      if (vrDisplay.getFrameData) {
        vrDisplay.getFrameData(frameData)
        pose = frameData.pose
      } else if (vrDisplay.getPose) {
        pose = vrDisplay.getPose()
      }

      if (pose.orientation !== null) {
        vec4.fromValues(quaternion, ...pose.quaternion)
      }

      if (pose.position !== null) {
        vec3.fromValues(position, ...pose.position)
      } else {
        vec3.set(position, 0, 0, 0)
      }

      /*if (this.standing) {
        if (vrDisplay.stageParameters) {
          object.updateMatrix()

          standingMatrix.fromArray(
            vrDisplay.stageParameters.sittingToStandingTransform
          )
          object.applyMatrix(standingMatrix)
        } else {
          object.position.setY(object.position.y + this.userHeight)
        }
      }*/

      vec3.scale(position, position, scale)
    }
    emit("vrcontrols", { position, quaternion })
  }

  const engine = loop(function(dt) {
    updateVr()
  }).start()

  return {
    state,
    on,
    off,
    destroy,
  }
}

export default Accelerometer
