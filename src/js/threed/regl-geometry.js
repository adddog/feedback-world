const normals = require("angle-normals")
import mat4 from "gl-mat4"

const ReglGeometry = regl => {
  const icosphere = require("icosphere")(1)

  //const mm = mat4.create()
  //const tr = mat4.translate(mm, mm, [0, 1, -2])
  //const modelB = mat4.scale(tr, tr, [0.2, 0.2, 0.2])

  function SphereMesh() {
    this._normals = normals(icosphere.cells, icosphere.positions)
  }

  SphereMesh.prototype.draw = regl({
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

      //gl_FragColor = vec4(0, 1, 0, 1);
    }`,

    uniforms: {
      // dynamic properties are invoked with the same `this` as the command
      model: regl.prop("model"),
      view: regl.context("view"),
      projection: regl.context("projection"),
      ambientLightAmount: 0.6,
      diffuseLightAmount: 0.3,
      color: regl.prop("color"),
      lightDir: [0.39, 0.87, 0.29],
    },

    attributes: {
      position: icosphere.positions,
      normal: regl.this("_normals"),
    },

    elements: icosphere.cells,
  })

  const _GEO = {
    sphere: SphereMesh,
  }

  function create(type) {
    return new _GEO[type]()
  }
  /*
  const sphere = new Mesh([], {
    positions: icosphere.positions,
    cells: icosphere.cells,
  })*/

  return {
    create,
    /*drawLight: sphere,
    drawSphere: sphere,*/
  }
}

export default ReglGeometry
