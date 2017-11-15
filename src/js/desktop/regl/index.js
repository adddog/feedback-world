import AppEmitter from "../../common/emitter"
import {FAR_Z} from "./constants"
import Regl from "regl"
import mat4 from "gl-mat4"
import ReglGeometryActions from "./regl-geometry-actions"
import ReglGeometry from "./regl-geometry"
import SingleDraw from "./single"
import MultiDraw from "./multi"
import GUI from "../../common/gui"
import { WIDTH, HEIGHT, logError } from "../../common"
import { find, map, isEmpty, compact } from "lodash"

const REGL = (canvas, assets) => {
  if (!Detector.isDesktop) return

  const regl = Regl({
    canvas: canvas,
    attributes: { stencil: true, preserveDrawingBuffer: true },
  })

  const singleDraw = SingleDraw(regl)
  const multiDraw = MultiDraw(regl)

  const reglGeometry = ReglGeometry(regl)
  const textures = {}

  const filterMask0 = regl({
    stencil: {
      enable: true,
      mask: 0xff,
      func: {
        cmp: "equal",
        ref: 0,
        mask: 0xff,
      },
    },
  })

  function destroy() {
    regl.destroy()
  }

  const updateTextures = assets => {
    let draw = true
    map(assets, (val, k) => {
      if (textures[k]) {
        textures[k](val.source)
      } else {
        try {
          textures[k] = regl.texture({
            format: val.format || "rgb",
            width: val.width,
            height: val.height,
            wrapS: "clamp",
            wrapT: "clamp",
            data: val.source,
          })
        } catch (e) {
          logError(`Bad texture at ${k}`)
          draw = false
        }
      }
    })
    return draw
  }

  const EYE = [0, 0, 2]
  const setupCamera = regl({
    context: {
      projection: ({ viewportWidth, viewportHeight }) => {
        return mat4.perspective(
          [],
          Math.PI / 2.1,
          viewportWidth / viewportHeight,
          0.001,
          FAR_Z
        )
      },

      view: mat4.lookAt([], EYE, [0, 0, 0], [0, 1, 0]),

      eye: EYE,
    },
  })

  function drawKey(assets) {
    if (updateTextures(assets)) {
      setupCamera(() => {
        regl.clear({
          color: [0, 0, 0, 1],
          depth: true,
          stencil: false,
        })
        multiDraw({
          texture: textures.mobile,
          keyVideo: textures.keyVideo,
          keyColors: textures.keyColors,
          slope:GUI.slope,
          tolerance:GUI.tolerance,
        })
        //ReglGeometryActions.update()
      })
    }
  }

  AppEmitter.on("addKeyColor", ({ color, position }) => {
    const props = { color: color.map(v => v / 255), position }
    const sphere = reglGeometry.create("sphere")
    ReglGeometryActions.add(sphere, "fly", props)
  })

  //const modelB = mat4.scale(lightM, lightM, [0.2, 0.2, 0.2])
  let _x = 0
  let _z = 0
  function drawSingle(assets) {
    if (updateTextures(assets)) {
      //_x += GUI.deviceOrien.alpha
      _x = GUI.deviceOrien.alpha
      /*_x += _x < 0 ? 0.001 : -0.001
      _z += GUI.deviceMotion.z * -0.1*/
      //_z += (_z < 0) ? 0.001 : -0.001
      setupCamera(() => {
        regl.clear({
          color: [0, 0, 0, 1],
          depth: true,
          stencil: false,
        })
        singleDraw({
          texture: textures.mobile,
          flipX: assets.flipX ? -1 : 1,
        })
        ReglGeometryActions.update()

        //const lightM = mat4.create()
        /*reglGeometry.drawLight({
          color: [0, 1, 0],
          translation: mat4.translate(lightM, lightM, [
            _x,
            0, //GUI.deviceMotion.y,
            _z, //GUI.deviceMotion.z + 2,
          ]),
        })*/
        /*geo.forEach(({ color, position }) => {
          const tr = mat4.create()
          const d = 4
          mat4.translate(tr, tr, [
            (position.x * 2 - 1) * d,
            (position.y * 2 - 1) * -1,
            -d,
          ])
          reglGeometry.drawSphere({ color, translation: tr })
        })*/
      })
    }
  }

  //const data = new Uint8Array(WIDTH * HEIGHT * 4)
  function read() {
    return regl.read(new Uint8Array(WIDTH * HEIGHT * 4))
  }

  return {
    drawKey,
    drawSingle,
    read,
  }
}

export default REGL
