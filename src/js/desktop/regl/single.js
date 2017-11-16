import * as Color from './color-glsl'
const Single = regl => {
  return regl({
    vert: `
  precision lowp float;
  attribute vec2 position;
  uniform mat4 projection, view, model;
  varying vec2 vUv;
  void main () {
    vUv = position;
    vec2 adjusted = 1.0 - 2.0 * position;
    vec4 pos =  vec4(adjusted,0,1);
    //gl_Position = vec4(imagePosition, 0, 1);
    gl_Position =  pos;
    //gl_Position =  vec4(adjusted,0,1);
  }`,

    frag: `

      precision lowp float;
      uniform int flipX;
      uniform sampler2D texture;

        ${Color.uniform}

      varying vec2 vUv;

        ${Color.glsl}



      void main () {
        vec2 uv = vUv;
        uv.x *= float(flipX);
        vec3 color = texture2D(texture, uv).rgb;
        color = changeSaturation(color, uSaturation);
        gl_FragColor = vec4(color,1);
      }`,
    attributes: {
      position: [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, -1],
        [1, 1],
        [-1, 1],
      ],
    },
    count: 6,
    depth: {
      mask: false,
      enable: false,
    },
    uniforms: {
      view: regl.context("view"),
      model: [
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        -1, // z
        1,
      ],
      projection: regl.context("projection"),
      flipX: regl.prop("flipX"),
      uSaturation: regl.prop("uSaturation"),
      texture: regl.prop("texture"),
    },
  })
}
export default Single
