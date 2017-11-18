const normals = require("angle-normals")
import mat4 from "gl-mat4"

const ReglMeshGeometry = regl => {
  const icosphere = require("icosphere")(2)
  icosphere.normals = normals(icosphere.cells, icosphere.positions)
  /*const modelM = mat4.create()
  mat4.translate(modelM, modelM, [0, 0, -5])
  mat4.rotateZ(modelM, modelM, Math.PI/2)*/
  function drawMesh(mesh, modelMatrix) {
    regl({
      vert: `
    precision lowp float;
    uniform mat4 projection, view, model;
    attribute vec3 position;
    attribute vec3 normal;

    varying vec3 vNormal;
    varying vec3 vPosition;

    void main () {
      vNormal = normal;
      vPosition = position;
      gl_Position = projection * view * model * vec4(position, 1);
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
          mat4.rotateY(modelMatrix,modelMatrix, 0.01)
          mat4.rotateX(modelMatrix,modelMatrix, 0.01)
          return modelMatrix
        },
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
    })({ mesh })
  }

  function draw(mesh, modelMatrix) {
    return drawMesh(mesh, modelMatrix)
  }

  return {
    draw,
  }
}

export default ReglMeshGeometry
