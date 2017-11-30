import Regl from "regl"
import mat4 from "gl-mat4"
import { vec3 } from "gl-matrix"
import { find, map, isEmpty, compact, noop } from "lodash"
import AppEmitter from "common/emitter"
import GUI from "common/gui"
import { WIDTH, HEIGHT, FPS, logError } from "common/constants"
import { FAR_Z } from "desktop/regl/constants"
import ReglGeometryActions from "desktop/regl/regl-geometry-actions"
import ReglGeometry from "desktop/regl/regl-geometry"
import ReglMeshGeometry from "desktop/regl/regl-mesh-geometry"
import SDFDraw from "desktop/regl/sdf"
import SingleDraw from "desktop/regl/single"
import MultiDraw from "desktop/regl/multi"

const REGL = (canvas, options) => {
  if (!Detector.isDesktop) return

  const regl = Regl({
    canvas: canvas,
    attributes: { stencil: true, preserveDrawingBuffer: true },
  })

  const singleDraw = SingleDraw(regl)
  const multiDraw = MultiDraw(regl)
  const sdfDraw = SDFDraw(regl)

  const reglGeometry = ReglGeometry(regl)
  const reglMeshGeometry = ReglMeshGeometry(regl)
  const textures = {}

  let eyeMatrix = mat4.create()
  let deviceAcceleration = vec3.create()

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

      deviceAcceleration: () => deviceAcceleration,
      eyeMatrix: () => eyeMatrix,

      view: mat4.lookAt([], EYE, [0, 0, 0], [0, 1, 0]),
    },
  })

  const setUniforms = () => {
    vec3.set(
      deviceAcceleration,
      GUI.deviceMotion.x + 1,
      GUI.deviceMotion.y + 1,
      GUI.deviceMotion.z + 1
    )
  }

  let _sequencer = { update: noop }
  window.Sequencer.start(
    regl,
    ({visual, state, Tone, music}) => {
      var stream_dest = Tone.context.createMediaStreamDestination()
      Tone.Master.output.output._gainNode.connect(stream_dest)
      _sequencer = visual
      options.onSequenerLoaded(stream_dest.stream)
    },
    "assets/audio.json",
    canvas.parentNode,
    {
      fps: FPS,
    }
  )

  function drawKey(assets) {
    if (updateTextures(assets)) {
      setUniforms()
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
          uSaturation: 1, // GUI.uSaturation,
          slope: GUI.slope,
          tolerance: GUI.tolerance,
        })
        sdfDraw()
        reglMeshGeometry.draw({ texture: textures.mobile })
        _sequencer.update()
        //ReglGeometryActions.update()
      })
    }
  }

  AppEmitter.on("addKeyColor", ({ color, position }) => {
    const props = { color: color.map(v => v / 255), position }
    const sphere = reglGeometry.create("sphere")
    ReglGeometryActions.add(sphere, "fly", props)
  })

  function drawSingle(assets) {
    if (updateTextures(assets)) {
      setUniforms()
      setupCamera(() => {
        regl.clear({
          color: [0, 0, 0, 1],
          depth: true,
          stencil: false,
        })
        singleDraw({
          texture: textures.mobile,
          uSaturation: 1, //GUI.uSaturation,
          flipX: assets.flipX ? -1 : 1,
        })
        sdfDraw()
        _sequencer.update()
        //  ReglGeometryActions.update()
        //reglMeshGeometry.draw({ texture: textures.mobile })
      })
    }
  }

  setupCamera(() => {
    regl.clear({
      color: [0.1, 0.1, 0.1, 1],
      depth: true,
      stencil: false,
    })
  })

  function addMesh(mesh, modelMatrix) {
    if (!mesh) return
    reglMeshGeometry.add(mesh, modelMatrix)
  }

  function drawMeshes() {
    setupCamera(() => {
      regl.clear({
        color: [0.1, 0.1, 0.1, 1],
        depth: true,
        stencil: false,
      })
      //reglMeshGeometry.draw()
      _sequencer.update()
    })
  }

  function setEyeMatrixDeviceQuaternion(quat) {
    eyeMatrix = mat4.fromQuat(eyeMatrix, quat)
  }

  function setDesktopEyeMatrix(matrix) {
    eyeMatrix = mat4.clone(matrix)
  }

  //const data = new Uint8Array(WIDTH * HEIGHT * 4)
  function read() {
    return regl.read(new Uint8Array(WIDTH * HEIGHT * 4))
  }

  return {
    addMesh,
    drawKey,
    setEyeMatrixDeviceQuaternion,
    setDesktopEyeMatrix,
    drawSingle,
    drawMeshes,
    read,
  }
}

export default REGL
