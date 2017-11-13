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

    #define PI 3.14159265359;
    #define TAU 6.28318530718;
    #define MOIRE 100.;
    #define amount 8.0;

  precision lowp float;
  uniform sampler2D texture;
  uniform vec2 mouse;
  uniform vec2 mouseN;
  uniform vec2 circleAndTime;
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

  //15
  float triSDF(vec2 st){
    st = (st *2.-1.)*2.;
    return max(abs(st.x)* 0.866025 + st.y * 0.5, -st.y * 0.5);
  }

  //17
float rhombSDF(vec2 st){
  return max(triSDF(st),
     triSDF(vec2(st.x,1.-st.y))
     );
}

//19
vec2 rotate(vec2 st, float a){
  st = mat2(cos(a), -sin(a), sin(a), cos(a)) * (st-.5);
  return st+.5;
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
    st.x*=aspect;
    st.x-= max((aspect-1.)/2.,0.);
    float dist = length(gl_FragCoord.xy - mouse);
    float distCenter = length(vec2(0.5, 0.5) - mouseN);
    st.x *= 2.;
    st.x -= circleAndTime.x;
    st.y *= 2.;
    st.y -= circleAndTime.y;
    //st.x *= aspect;
    //st.y *= aspect;
    vec2 mouseSt = circleAndTime;

    vec4 acidColor = exp(-0.01 * dist) * vec4(
        1.0 + cos(2.0 * t),
        1.0 + cos(2.0 * t + 1.5),
        1.0 + cos(2.0 * t + 3.0),
        0.0);
    float color1 = 0.2;

    //## pixelate
  float d = 1.0 / amount;
  float ar = gl_FragCoord.x / gl_FragCoord.y;
  float u = floor( uv.x / d ) * d;
  d = ar / amount;
  float v = floor( uv.y / d ) * d;
  vec4 pixelate = texture2D( texture, vec2( u, v ) );

  vec2 moireSt = st * 0.2;
  moireSt -= .1;
  float r = dot(moireSt,moireSt);
  float a = atan(moireSt.y,moireSt.x) / PI;
  vec2 truthUV = vec2(r,a);
  float _m = MOIRE;
  vec2 grid = vec2(_m * distCenter ,log(r)*(_m + 20.) * distCenter);
  vec2 truthUV_i = floor(grid * truthUV);
  truthUV.x += .5*mod(truthUV_i.y,2.0);
  vec2 truthUV_f = fract(truthUV*grid);
  float shape = rhombSDF(truthUV_f);
  color1 += fill(shape, .8)*step(.5,1.-r);

  color1 += 0.4;



    //color += stroke(circleSDF(st), circleAndTime.x/circleAndTime.y, abs(sin(circleAndTime.y)*0.05));
    //color1 += step(0.5,spiralSDF(st,mouseSt.x/mouseSt.y*.13));

    float color2 = 0.2;
    color2 += step(0.5,spiralSDF(st,mouseSt.x/mouseSt.y*.13));
    // color2 += fill(circleSDF(uv),.65);
    // vec2 offset = vec2(.1,.05);
    // color2 += fill(circleSDF(uv-offset),.5);

    vec3 colorMix1 = color1 * acidColor.rgb;
    vec3 colorMix2 = color2 * (1.-acidColor.rgb);

    float osc = abs(sin(t * 0.1) *0.5+0.5);

    vec3 color = mix(colorMix2,colorMix1, osc);

    // float s = starSDF(st.yx, 5, .1);
    // color *= step(.7,s);
    // color += stroke(s, 0.4, .1);

    vec4 feedback = mix(
      vec4(color * acidColor.rgb,1.),
      vec4(0.98 * texture2D(texture,
      uv + cos(t) * vec2(0.5 - uv.y, uv.x - 0.5) - sin(2.0 * t) * (uv - 0.5)).rgb, 1),
      osc * 0.5);

    //gl_FragColor = vec4(color * acidColor.rgb,1.);
    //gl_FragColor = vec4(mouseSt,0.5,1.);
    gl_FragColor = feedback;
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
      circleAndTime: ({ tick, viewportHeight, viewportWidth }) => [
        Math.cos(tick * 0.01) * 0.5 + 0.5,
        Math.sin(tick * 0.01) * 0.5 + 0.5,
      ],
      mouseN: ({ viewportHeight, viewportWidth }) => [
        mouse.x / viewportWidth,
        mouse.y / viewportHeight,
      ],
      aspect: ({ viewportHeight, viewportWidth }) =>
        viewportWidth / viewportHeight,
      t: ({ tick }) => tick * 0.01,
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

  function destroy() {
    console.log("destroy")
    regl.destroy()
  }

  return {
    destroy,
  }
}

export default REGL
