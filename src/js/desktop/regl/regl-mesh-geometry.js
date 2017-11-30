import { FAR_Z, Z_SPEED, Z_AMP, Y_AMP } from "./constants"
import Gui from "common/gui"
import AppEmitter from "common/emitter"
import * as Color from './color-glsl'
import { inverse,rotationMatrix } from "./glsl-utils"
import mat4 from "gl-mat4"

const ReglMeshGeometry = regl => {
  const _meshes = []

  function drawMesh({ mesh, model }, props) {
    regl({
      vert: `
      #define PI 3.14159265359;

    precision lowp float;
    uniform mat4 projection, view, model, eyeMatrix;
    uniform vec3 deviceAcceleration;
    attribute vec3 position;
    attribute vec3 normal;

    varying vec3 vNormal;
    varying vec3 vPosition;

    varying vec3    vEyePosition;
    varying vec3    vWsNormal;
    varying vec3    vWsPosition;

      varying vec4    vDrawingCoord;

      const mat4 biasMatrix = mat4( 0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0 );

    ${rotationMatrix}
    ${inverse}

    void main () {
      vec3 newPos = position;
      //y mod
      newPos.x *= cos(newPos.x * max(abs(deviceAcceleration.x),0.1)) * 0.5 + 0.5;

      float pi = PI;
      mat4 rotY = rotationMatrix( vec3(1.,1.,0.), pi / 2. + 0.8 );
      mat4 rotX = rotationMatrix( vec3(1.,0.,0.), pi / 2. );

      mat4 modelTransformation = model * rotY * rotX * eyeMatrix;

      vec4 worldSpacePosition = modelTransformation * vec4(newPos, 1.0);
      vec4 viewSpacePosition  = view * worldSpacePosition;

      mat4 modelViewMatrixInverse = inverse(view * modelTransformation);

      vWsPosition          = worldSpacePosition.xyz;

      vec4 eyeDirViewSpace    = viewSpacePosition - vec4( 0, 0, 0, 1 );
      vEyePosition            = -vec3( modelViewMatrixInverse * eyeDirViewSpace ).xyz;
      vWsNormal               = normalize( modelViewMatrixInverse * vec4(vNormal,1.) ).xyz;

      vDrawingCoord           = ( biasMatrix * (projection * view) * modelTransformation ) * vec4(newPos, 1.0);

      vNormal = normal;
      vPosition = newPos;

      gl_Position = projection * view * modelTransformation * vec4(newPos, 1);
    }`,

      frag: `
    precision lowp float;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3    vEyePosition;
    varying vec3    vWsNormal;
    varying vec3    vWsPosition;
    //varying vec2    vTextureCoord;
    varying vec4    vDrawingCoord;

    uniform float ambientLightAmount;
    uniform float diffuseLightAmount;

    uniform sampler2D texture;

    ${Color.uniform}

    const float drawingBias     = .00005;

    ${Color.glsl}

    void main () {
      vec4 drawingCoord = vDrawingCoord / vDrawingCoord.w;
      drawingCoord.xy = mix(drawingCoord.xy, (drawingCoord.xy + normalize(vPosition*vWsNormal).gb ) / 2. + 0.5, 0.5);

      const float drawingBias     = .00005;
      vec4 colorDrawing = texture2DProj(texture, drawingCoord, drawingBias);

      float cosTheta = dot(vNormal, vEyePosition);
      float saturation = clamp(cosTheta, 0., 1.) * uSaturation;
      vec3 finalColor = colorDrawing.rgb;
      finalColor = changeSaturation(finalColor, saturation);
      finalColor.r = fract(finalColor.r);
      finalColor.g = fract(finalColor.g);
      finalColor.b = fract(finalColor.b);

      gl_FragColor = vec4(finalColor, 1.0);
    }`,

      uniforms: {
        // dynamic properties are invoked with the same `this` as the command
        model: () => mat4.translate(model, model, [0, 0, Z_SPEED]),
        texture: props.texture,
        deviceAcceleration: regl.context("deviceAcceleration"),
        eyeMatrix: regl.context("eyeMatrix"),
        view: regl.context("view"),
        projection: regl.context("projection"),
        uSaturation: 3.,
      },

      attributes: {
        position: mesh.positions,
        normal: mesh.normals,
      },

      elements: mesh.cells,
    })()
  }

  function add(mesh, modelMatrix) {
    if(!modelMatrix){
      modelMatrix = mat4.create()
      const { landscape } = Gui.mobileDeviceOrientation || {landscape:false}
      console.log(`No modelMatrix passed. Is landscape: ${landscape}`);
      mat4.translate(modelMatrix, modelMatrix, [
        //Y AXIS
        landscape ? -Y_AMP : Y_AMP / 2 - 20,
        //X AXIS
        landscape ? -Z_AMP : -Z_AMP / 2 - 20,
        -FAR_Z,
      ])
      mat4.rotateZ(modelMatrix, modelMatrix, Math.PI / 2)
    }
    //mat4.rotateX(modelMatrix, modelMatrix, Math.PI/2)
    const meshObj = {
      mesh,
      model: modelMatrix,
    }
    console.log(meshObj);
    _meshes.push(meshObj)
    /*
    // LIMIT TO ONE
    */
    if(_meshes.length > 1){
      _meshes.shift()
    }
    return meshObj
  }

  function draw(props) {
    _meshes.forEach((meshObj, i) => {
      if (meshObj.model[14] > FAR_Z) {
        _meshes.splice(i, 1)
        AppEmitter.emit("regl:mesh:removed")
      } else {
        drawMesh(meshObj, props)
      }
    })
  }

  return {
    add,
    draw,
  }
}

export default ReglMeshGeometry
