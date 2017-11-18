import { autobind } from "core-decorators"
import EaseNumber from "./ease-number"
import cylinder from "primitive-cylinder"
import { vec3, quat } from "gl-matrix"

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

export default class VerseControls {
    constructor(containerElement) {
        this.containerElement = containerElement
        this.lon = new EaseNumber(0, 0.02)
        this.lat = new EaseNumber(0, 0.02)
        this.sensitivity = 1
        this.position = vec3.create()
        this.attachEventListeners()
    }

    @autobind
    attachEventListeners() {
        if (!this.containerElement) {
            console.warn(
                "attached called before container element assigned"
            ) // eslint-disable-line  no-console
            return
        }
        /*this.containerElement.addEventListener("mousedown", this.handleMouseDown);
        this.containerElement.addEventListener("mouseup", this.handleMouseUp);
        this.containerElement.addEventListener("mouseleave", this.handleMouseUp);*/
        this.containerElement.addEventListener(
            "mousemove",
            this.handleMouseMove
        )
        /*this.containerElement.addEventListener("touchstart", this.handleMouseDown);
        this.containerElement.addEventListener("touchmove", this.handleMouseMove);*/
    }

    removeEventListeners() {
        if (!this.containerElement) {
            console.warn(
                "remove called after container element destroyed"
            ) // eslint-disable-line  no-console
            return
        }

        this.containerElement.removeEventListener(
            "mousedown",
            this.handleMouseDown
        )
        this.containerElement.removeEventListener(
            "mouseup",
            this.handleMouseUp
        )
        this.containerElement.removeEventListener(
            "mouseleave",
            this.handleMouseUp
        )
        this.containerElement.removeEventListener(
            "mousemove",
            this.handleMouseMove
        )
        this.containerElement.removeEventListener(
            "touchstart",
            this.handleMouseDown
        )
        this.containerElement.removeEventListener(
            "touchmove",
            this.handleMouseMove
        )
    }

    @autobind
    handleMouseDown(e) {
        this.isDragging = true

        const coords = VerseControls.getPageCoords(e)
        this.startX = coords.x
        this.startY = coords.y
    }

    @autobind
    handleMouseMove(e) {
        e.stopPropagation()
        e.preventDefault()
        const {
            x: clientX,
            y: clientY,
        } = VerseControls.getPageCoords(e)
        this.startX = this.startX || clientX
        this.startY = this.startY || clientY
        const targetLon = (this.startX - clientX) * this.sensitivity
        this.lon.add(targetLon)
        const targetLat = (clientY - this.startY) * this.sensitivity
        this.lat.add(targetLat)
        this.startX = clientX
        this.startY = clientY
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
        polarToVector3(lon, lat, 2, this.position)
        return vec3.clone(this.position)
    }

    getGeometry(points){
        return cylinder(0.7, 0.7, 2, 6, points.length-1, points)
    }

    update() {
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

    destroy() {
        this.removeEventListeners()
    }
}
