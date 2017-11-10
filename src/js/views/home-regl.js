import Regl from "regl"
import { cover } from "intrinsic-scale"
import { WIDTH, HEIGHT } from "../common"
const mouse = require("mouse-change")()

const REGL = el => {
  const regl = Regl({
    container: el,
  })

  /*let scale

  const resizeCanvas = (w = WIDTH, h = HEIGHT) => {
    let { width, height, x, y } = cover(
      window.innerWidth,
      window.innerHeight,
      w,
      h
    )
  }

  //window.addEventListener("resize", () => resizeCanvas(WIDTH, HEIGHT))

  resizeCanvas(WIDTH, HEIGHT)*/

  const pixels = regl.texture()

  const drawFeedback = regl({
    frag: `

    #define TAU 6.28318530718;

  precision lowp float;
  uniform sampler2D texture;
  uniform vec2 mouse;
  uniform vec2 mouseN;
  uniform float t;
  uniform float aspect;
  varying vec2 uv;


  //04
  float stroke(float x, float s, float w){
    float d = step(s,x+w*0.5)-
      step(s,x-w*0.5);
      return clamp(d, 0.,1.);
  }

  //08
  float circleSDF(vec2 st){
    return length(st-0.5)*2.;
  }

  //09
  float fill(float x, float size){
    return 1.-step(size,x);
  }

  float starSDF(vec2 st, int V, float s){
    st= st *4.-2.;
    float a= atan(st.y, st.x)/TAU;
    float seg = a * float(V);
    a=((floor(seg) + 0.5) / float(V) +
      mix(s,-s,step(0.5,fract(seg))))  * TAU;
    return abs(dot(vec2(cos(a),sin(a)),st));
  }

  //47
  float spiralSDF(vec2 st, float t){
    st-=0.5;
    float r=dot(st,st);
    float a= atan(st.y,st.x);
    return abs(sin(fract(log(r)*t+a*0.159)));
  }


  void main () {
    vec2 st = uv;
    float dist = length(gl_FragCoord.xy - mouse);
    st.x *= 2.;
    st.x -= mouseN.x;
    st.y *= 2.;
    st.y -= mouseN.y;
    //st.x *= aspect;
    //st.y *= aspect;
    float color1 = 0.;
    //color += stroke(circleSDF(st), mouseN.x/mouseN.y, abs(sin(mouseN.y)*0.05));
    color1 += step(0.5,spiralSDF(st,mouseN.x/mouseN.y*.13));
    float color2 = 0.;
    color2 += fill(circleSDF(st),.65);
    vec2 offset = vec2(.1,.05);
    color2 += fill(circleSDF(st-offset),.5);

    float color = mix(color1,color2, abs(sin(t)));

    // float s = starSDF(st.yx, 5, .1);
    // color *= step(.7,s);
    // color += stroke(s, 0.4, .1);

    gl_FragColor = mix(vec4(vec3(color),1.),vec4(0.98 * texture2D(texture,
      uv + cos(t) * vec2(0.5 - uv.y, uv.x - 0.5) - sin(2.0 * t) * (uv - 0.5)).rgb, 1) +
      exp(-0.01 * dist) * vec4(
        1.0 + cos(2.0 * t),
        1.0 + cos(2.0 * t + 1.5),
        1.0 + cos(2.0 * t + 3.0),
        0.0),0.8);
      //gl_FragColor = vec4(st,0.5,1.);
      //gl_FragColor = vec4(vec3(dist),1.);
  }`,

    vert: `
  precision lowp float;
  attribute vec2 position;
  varying vec2 uv;
  void main () {
    uv = position;
    gl_Position = vec4(2.0 * position - 1.0, 0, 1);
  }`,

    attributes: {
      position: [-2, 0, 0, -2, 2, 2],
    },

    uniforms: {
      texture: pixels,
      mouse: ({ pixelRatio, viewportHeight }) => [
        mouse.x * pixelRatio,
        viewportHeight - mouse.y * pixelRatio,
      ],
      mouseN: ({ viewportHeight, viewportWidth }) => [
        mouse.x / viewportWidth * 2 -1,
        mouse.y / viewportHeight *2-1,
      ],
      aspect: 1, //scale,
      t: ({ tick }) => 0.01 * tick,
    },

    count: 3,
  })

  regl.frame(function() {
    regl.clear({
      color: [0, 0, 0, 1],
    })

    drawFeedback()

    pixels({
      copy: true,
    })
  })

  function destroy(){
    console.log("ULOAD");
    regl.destroy()
  }

  return {
    destroy
  }
}

export default REGL
