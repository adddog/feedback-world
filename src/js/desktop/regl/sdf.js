import SDFs from "common/sdfs"
const SDF = regl => {
    const modelMatrix = [
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
  ]
  return regl({
    vert: `
  precision lowp float;
  attribute vec2 position;
  uniform mat4 projection, view, model;
  varying vec2 vUv;
  void main () {
    vUv = position;
    vec2 adjusted = 1.0 - 2.0 * position;
    gl_Position =  vec4(adjusted,0,1);
  }`,

    frag: `

    #define PI 3.14159265359;
    #define TAU 6.28318530718;

      precision lowp float;
      uniform float aspect;
      varying vec2 vUv;

      ${SDFs}

      void main () {
        vec2 uv = vUv;
        vec2 st = uv;
        st.x*=aspect;
        st.x-= max((aspect-1.)/2.,0.);
        float color = 0.;
        color += stroke(circleSDF(st), 0.7, 0.2);
        if(color == 0. ){
          discard;
        }else{
          gl_FragColor = vec4(vec3(color),1);
        }
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
      model:modelMatrix,
      aspect: ({ viewportHeight, viewportWidth }) =>
        viewportWidth / viewportHeight,
      projection: regl.context("projection"),
    },
  })
}
export default SDF
