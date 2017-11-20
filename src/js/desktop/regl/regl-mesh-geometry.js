import { FAR_Z, Z_SPEED, Z_AMP, Y_AMP } from "./constants"
import Gui from "../../common/gui"
import AppEmitter from "../../common/emitter"
import { rotationMatrix } from "./color-glsl"
import mat4 from "gl-mat4"

const ReglMeshGeometry = regl => {
  const _meshes = []
  let _t = 0

  function drawMesh({ mesh, model }) {
    regl({
      vert: `
      #define PI 3.14159265359;

    precision lowp float;
    uniform mat4 projection, view, model, deviceQuat;
    attribute vec3 position;
    attribute vec3 normal;

    varying vec3 vNormal;
    varying vec3 vPosition;

    ${rotationMatrix}

    void main () {
      vNormal = normal;
      float pi = PI;
      mat4 rotY = rotationMatrix( vec3(1.,1.,0.), pi / 2. + 0.8 );
      mat4 rotX = rotationMatrix( vec3(1.,0.,0.), pi / 2. );
      vPosition = position;
      gl_Position = projection * view * (model * rotY * rotX * deviceQuat) * vec4(position, 1);
    }`,

      frag: `
    precision lowp float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float ambientLightAmount;
    uniform float diffuseLightAmount;

    uniform vec3 lightDir;

    uniform vec3 color;


    void main () {
      vec3 ambient = ambientLightAmount * color;
      float cosTheta = dot(vNormal, lightDir);
      vec3 diffuse = diffuseLightAmount * color * clamp(cosTheta , 0.0, 1.0 );
      gl_FragColor = vec4((ambient + diffuse), 1.0);
    }`,

      uniforms: {
        // dynamic properties are invoked with the same `this` as the command
        model: () => {
          return mat4.translate(model, model, [0, 0, Z_SPEED])
        },
        deviceQuat: regl.context("deviceQuat"),
        view: regl.context("view"),
        projection: regl.context("projection"),
        ambientLightAmount: 0.6,
        diffuseLightAmount: 0.3,
        color: [0.2, 0.4, 0.11],
        lightDir: [0.39, 0.87, 0.29],
      },

      attributes: {
        position: mesh.positions,
        normal: mesh.normals,
      },

      elements: mesh.cells,
    })()
  }

  function add(mesh) {
    const modelMatrix = mat4.create()
    const { landscape } = Gui.mobileDeviceOrientation
    mat4.translate(modelMatrix, modelMatrix, [
      landscape ? Z_AMP / 2 - 10 : Z_AMP / 2,
      landscape ? -Y_AMP / 2 - 20 : -Y_AMP / 2,
      -FAR_Z,
    ])
    mat4.rotateZ(modelMatrix, modelMatrix, Math.PI / 2)
    //mat4.rotateX(modelMatrix, modelMatrix, Math.PI/2)
    const meshObj = {
      mesh,
      model: modelMatrix,
    }
    _meshes.push(meshObj)
    return meshObj
  }

  function draw() {
    _meshes.forEach((meshObj, i) => {
      if (meshObj.model[14] > FAR_Z / 2) {
        _meshes.splice(i, 1)
        AppEmitter.emit("regl:mesh:removed")
      } else {
        drawMesh(meshObj)
      }
    })
  }

  return {
    add,
    draw,
  }
}

export default ReglMeshGeometry
