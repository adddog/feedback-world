import { autobind } from "core-decorators"
import AppEmitter from "../common/emitter"
import { random, throttle } from "lodash"
import EaseNumber from "./ease-number"
import { POLAR_RADIUS, FAR_Z } from "./regl/constants"
import cylinder from "primitive-cylinder"
import { vec3, quat, mat4 } from "gl-matrix"

const MAX_POINTS = 700
const FPS = 1000 / 9

const isFunction = function(obj) {
    return typeof obj == "function" || false
}

const degToRad = degrees => degrees * (Math.PI / 180)

function polarToVector3(lon, lat, radius, vector) {
    const phi = degToRad(90 - lat)
    const theta = degToRad(lon)
    vec3.set(
        vector,
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        Math.abs(radius * Math.sin(phi) * Math.sin(theta))
    )

    return vector
}

export default class GeoInteractions {
    constructor(containerElement) {
        this.containerElement = containerElement
        this._listeners = new Map()
        this._started = false
        this._enabled = true
        //this.handleMouseMove = throttle(this.handleMouseMove, 200)
        this.lon = new EaseNumber(0, 0.02)
        this.lat = new EaseNumber(0, 0.02)
        this._vectorPositions = []
        this.sensitivity = 2
        this._time = 0
        this._lookAtMatrix = mat4.create()
        this.position = vec3.create()
        this.attachEventListeners()
    }

    @autobind
    attachEventListeners() {
        if (!this.containerElement) {
            console.warn(
                "attached called before container element assigned"
            )
            return
        }
        this.containerElement.addEventListener(
            "mousemove",
            this.handleMouseMove
        )
    }

    removeEventListeners() {
        if (!this.containerElement) {
            console.warn(
                "remove called after container element destroyed"
            )
            return
        }

        this.containerElement.removeEventListener(
            "mousemove",
            this.handleMouseMove
        )
    }

    @autobind
    handleMouseDown(e) {
        this.isDragging = true

        const coords = GeoInteractions.getPageCoords(e)
        this.startX = coords.x
        this.startY = coords.y
    }

    @autobind
    handleMouseMove(e) {
        e.stopPropagation()
        e.preventDefault()
        if (!this._enabled) return
        const {
            x: clientX,
            y: clientY,
        } = GeoInteractions.getPageCoords(e)
        this.startX = this.startX || clientX
        this.startY = this.startY || clientY
        const targetLon = (this.startX - clientX) * this.sensitivity
        this.lon.add(targetLon)
        const targetLat = (clientY - this.startY) * this.sensitivity
        this.lat.add(targetLat)
        this.startX = clientX
        this.startY = clientY

        const p = performance.now()
        if (p - this._time > FPS) {
            this._vectorPositions.push(this.positions)
            if (this._vectorPositions.length > MAX_POINTS) {
                this._vectorPositions.shift()
            }
            if (!this._started) {
                if (this._vectorPositions.length > 20) {
                    this._started = true
                    AppEmitter.emit("regl:mesh:removed")
                }
            }
            this._time = p
        }

        this.emit("mousemove")
    }

    emit(label, ...args) {
        let func = this._listeners.get(label)

        if (func && func.length) {
            func.forEach(listener => {
                listener(...args)
            })
            return true
        }
        return false
    }

    on(label, callback) {
        this._listeners.has(label) || this._listeners.set(label, [])
        this._listeners.get(label).push(callback)
    }

    off(label, callback) {
        let funcs = this._listeners.get(label),
            index

        if (funcs && funcs.length) {
            index = funcs.reduce((i, listener, index) => {
                return isFunction(listener) && listener === callback
                    ? (i = index)
                    : i
            }, -1)

            if (index > -1) {
                funcs.splice(index, 1)
                this._listeners.set(label, listeners)
                return true
            }
        }
        return false
    }

    /*
    We get the difference between Previous and Current gyro positions
    Use difference in the update()
    */
    static getPageCoords(e) {
        const coords = {}
        if (e.touches) {
            coords.x = e.touches[0].pageX
            coords.y = e.touches[0].pageY
        } else {
            coords.x = e.clientX
            coords.y = e.clientY
        }
        return coords
    }

    @autobind
    handleMouseUp() {
        this.isDragging = false
    }

    getCoordinates() {
        return {
            lat: this.lat.value,
            lon: this.lon.value,
        }
    }

    get positions() {
        this.lon.update()
        this.lat.update()
        const lon = this.lon.value
        const lat = this.lat.value
        polarToVector3(lon, lat, POLAR_RADIUS, this.position)
        return vec3.clone(this.position)
    }

    enable(val) {
        this._enabled = val
    }

    getGeometry() {
        if (!this._enabled || this._vectorPositions.length < 1)
            return null
        let _d = 2
        this._vectorPositions.forEach((p, i) => {
            //p[0] += _d * i
            return p
        })
        return cylinder(
            0.7,
            0.7,
            10,
            6,
            this._vectorPositions.length - 1,
            this._vectorPositions
        )
    }

    get lookAt() {
        this.lon.update()
        this.lat.update()
        const lon = this.lon.value
        const lat = this.lat.value
        mat4.lookAt(
            this._lookAtMatrix,
            polarToVector3(lon, lat, POLAR_RADIUS, this.position),
            [0, 0, 0],
            [0, 1, 0]
        )
        return this._lookAtMatrix
    }

    get modelMatrix() {
        const modelMatrix = mat4.create()
        mat4.rotateZ(modelMatrix, modelMatrix, Math.PI / 2)
        mat4.translate(modelMatrix, modelMatrix, [10, -10, -FAR_Z])
        return modelMatrix
    }

    /*update() {
        this.lon.update()
        this.lat.update()
        const lon = this.lon.value
        const lat = this.lat.value

        this.lastTargetRotation = { lat, lon }
        //this.camera.up = new THREE.Vector3(0,1,0);
        this.camera.lookAt(
            polarToVector3(lon, lat, THEATER_RADIUS, this.position)
        )
        //save the actual position including the gyro
        this.store.dispatch(
            setCameraRotation(this.lastTargetRotation)
        )
        const latitude = Math.abs(lat % 360)
        const multiplier = latitude > 90 && latitude < 270 ? 1 : 0
        this.camera.rotateZ(Math.PI * multiplier)
    }
*/
    destroy() {
        this.removeEventListeners()
    }
}
