import loop from "raf-loop"
import { vec3, mat3, quat } from "gl-matrix"

const FPS = 1000 / 9

const degToRad = degrees => degrees * (Math.PI / 180)
const radToDeg = radians => radians * (180 / Math.PI)

const clamp = (val, min, max) => Math.min(Math.max(min, val), max)

const setFromVector3 = vector => {
  var radius = vec3.length(vector)
  var theta = 0
  var phi = 0

  if (radius !== 0) {
    theta = Math.atan2(vector[0], vector[2]) // equator angle around y-up axis
    phi = Math.acos(clamp(vector[1] / radius, -1, 1)) // polar angle
  }

  return {
    theta,
    phi,
  }
}

const eulerToQuat = (quaternion, euler) => {
  var x = euler[0],
    y = euler[1],
    z = euler[2]

  var cos = Math.cos
  var sin = Math.sin

  var c1 = cos(x / 2)
  var c2 = cos(y / 2)
  var c3 = cos(z / 2)

  var s1 = sin(x / 2)
  var s2 = sin(y / 2)
  var s3 = sin(z / 2)

  quat.set(
    quaternion,
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 - s1 * s2 * c3,
    c1 * c2 * c3 + s1 * s2 * s3
  )
  return quaternion
}

const polarToVector3 = (lon, lat, radius, vector) => {
  const phi = degToRad(90 - lat)
  const theta = degToRad(lon)

  vec3.set(
    vector,
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )

  return vector
}

const vector3ToPolar = vector => {
  const spherical = setFromVector3(vector)
  return {
    lat: radToDeg(spherical.phi),
    lon: radToDeg(spherical.theta),
  }
}

const applyQuatToVec3 = (vector, quaternion) => {
  var x = vector[0]
  var y = vector[1]
  var z = vector[2]

  var qx = quaternion[0]
  var qy = quaternion[1]
  var qz = quaternion[2]
  var qw = quaternion[3]

  // calculate quat * vector

  var ix = qw * x + qy * z - qz * y
  var iy = qw * y + qz * x - qx * z
  var iz = qw * z + qx * y - qy * x
  var iw = -qx * x - qy * y - qz * z

  // calculate result * inverse quat

  vec3.set(
    vector,
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx
  )
}

const applyMatrix3 = function(vector, m) {
  var x = vector[0]
  var y = vector[1]
  var z = vector[2]

  var e = m

  vec3.set(
    vector,
    e[0] * x + e[3] * y + e[6] * z,
    e[1] * x + e[4] * y + e[7] * z,
    e[2] * x + e[5] * y + e[8] * z
  )
  return vector
}

const isFunction = function(obj) {
  return typeof obj == "function" || false
}

const rightAngleRad = degToRad(90)
const Y_REFLECT_MATRIX = mat3.set(
  mat3.create(),
  1,
  0,
  0,
  0,
  -1,
  0,
  0,
  0,
  1
)
const CAMERA_ORIENTATION_X = quat.fromValues(
  -Math.sin(rightAngleRad / 2),
  0,
  0,
  Math.cos(rightAngleRad / 2)
)
const CAMERA_ORIENTATION_Y = quat.fromEuler(
  quat.create(),
  0,
  rightAngleRad,
  0
)

let euler = vec3.create()
let zVec = vec3.fromValues(0, 0, 1)
let quaternion = quat.create()
let rotationVector = vec3.create()
let _q0 = quat.fromValues(
  -Math.sin(rightAngleRad / 2),
  0,
  0,
  Math.cos(rightAngleRad / 2)
)
let _q1 = quat.fromValues(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5))

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

  const handleOrientation = event => {
    const { orientation } = window
    firstTime = true
    state = {
      ...state,
      orientation: orientation,
      ...{ landscape: orientation === 90 || orientation === -90 },
    }
    const { landscape, rotation } = state
    emit("orientationchange", { landscape, rotation })
  }

  //*********

  //*********

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

  const _gyroscope = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    orient: 0,
  }

  const _setObjectQuaternion = (
    quaternion,
    alpha,
    beta,
    gamma,
    orient
  ) => {
    //vec3.set(euler, beta, alpha, -gamma, "YXZ") // 'ZXY' for the device, but 'YXZ' for us
    vec3.set(euler, alpha, beta, -gamma) // 'ZXY' for the device, but 'YXZ' for us
    quat.fromEuler(quaternion, euler[0], euler[1], euler[2]) // orient the device
    quat.multiply(quaternion, quaternion, _q1)
    quat.setAxisAngle(_q0, zVec, -_gyroscope.orient) // orient the device
    quat.multiply(quaternion, quaternion, _q0)
  }

  const handleMovment = e => {
    if (firstTime) {
      offset.alpha = e.alpha
      offset.beta = e.beta
      offset.gamma = e.gamma
      firstTime = false
      return
    }

    _gyroscope.alpha = e.alpha ? degToRad(e.alpha) : 0 // Z
    _gyroscope.beta = e.beta ? degToRad(e.beta) : 0 // X'
    _gyroscope.gamma = e.gamma ? degToRad(e.gamma) : 0

    _gyroscope.orient = state.orientation
      ? degToRad(state.orientation)
      : 0 // O

    _setObjectQuaternion(
      quaternion,
      _gyroscope.alpha,
      _gyroscope.beta,
      _gyroscope.gamma,
      _gyroscope.orient
    )

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

    const p = performance.now()
    let _time = 0
    const dis = p - _time > FPS
    if (dis) {
      const xRad = degToRad(e.beta)
      const yRad = degToRad(e.gamma)
      const zRad = degToRad(e.alpha)
      vec3.set(euler, xRad, zRad, -yRad) //"YXZ"); // apply in YXZ rotation order
      eulerToQuat(quaternion, euler)
      //quat.fromEuler(quaternion, euler[0], euler[1], euler[2]) // orient the device
      quat.multiply(quaternion, quaternion, CAMERA_ORIENTATION_Y)
      vec3.set(rotationVector, 0, 0, 1)
      applyQuatToVec3(rotationVector, quaternion)
      applyQuatToVec3(rotationVector, CAMERA_ORIENTATION_Y)
      applyMatrix3(rotationVector, Y_REFLECT_MATRIX)

      const deviceOrientation = vector3ToPolar(rotationVector)
      //to match the rotation on desktop
      deviceOrientation.lon *= -1
      deviceOrientation.lat -= 90
      deviceOrientation.lat *= -1


      polarToVector3(
        deviceOrientation.lon,
        deviceOrientation.lat,
        4, //POLAR_RADIUS
        rotationVector
      )

      emit("device:quaternion", quaternion)
      emit("rotationvector", vec3.clone(rotationVector))

      _time = p
    }
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
  window.addEventListener("deviceorientation", handleMovment)
  window.addEventListener("devicemotion", handleAcceleration)
  window.addEventListener("orientationchange", handleOrientation)

  return {
    state,
    handleMovment,
    handleOrientation,
    on,
    off,
    destroy,
  }
}

export default Accelerometer
