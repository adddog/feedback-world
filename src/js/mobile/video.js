import Regl from "regl"
import { map } from "lodash"

const REGL = (el, assets) => {
  const regl = Regl({
    canvas: el,
  })
  const renderOptions = {
    useGyroscope: false,
    modifyHue: false,
    modifySat: false,
    modifyLum: false,
  }
  const textures = {...assets}
  const props = {
    rMod: 0,
    gMod: 0,
    bMod: 0,

    useHSL: 0,
  }
  const accelerometer = Accelerometer()

  accelerometer.on("devicemotion", state => {})

  accelerometer.on("rotationvector", data => {})

  accelerometer.on("deviceorientation", state => {
    if (renderOptions.useGyroscope) {
      props.rMod = renderOptions.modifyHue ? state.alpha / 360 : 0
      props.gMod = renderOptions.modifySat ? state.beta / 180 : 0
      props.bMod = renderOptions.modifyLum ? state.gamma / 180 : 0
    }
  })

  console.log(textures)

  const glsl = `

uniform float uSaturation;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 changeSaturation(vec3 color, float saturation) {
  float luma = dot(vec3(0.2125, 0.7154, 0.0721) * color, vec3(1.));
  return mix(vec3(luma), color, saturation);
 }

      vec3 RGBToHSL(vec3 color)
      {
        vec3 hsl; // init to 0 to avoid warnings ? (and reverse if + remove first part)

        float fmin = min(min(color.r, color.g), color.b);    //Min. value of RGB
        float fmax = max(max(color.r, color.g), color.b);    //Max. value of RGB
        float delta = fmax - fmin;             //Delta RGB value

        hsl.z = (fmax + fmin) / 2.0; // Luminance

        if (delta == 0.0)   //This is a gray, no chroma...
        {
          hsl.x = 0.0;  // Hue
          hsl.y = 0.0;  // Saturation
        }
        else                                    //Chromatic data...
        {
          if (hsl.z < 0.5)
            hsl.y = delta / (fmax + fmin); // Saturation
          else
            hsl.y = delta / (2.0 - fmax - fmin); // Saturation

          float deltaR = (((fmax - color.r) / 6.0) + (delta / 2.0)) / delta;
          float deltaG = (((fmax - color.g) / 6.0) + (delta / 2.0)) / delta;
          float deltaB = (((fmax - color.b) / 6.0) + (delta / 2.0)) / delta;

          if (color.r == fmax )
            hsl.x = deltaB - deltaG; // Hue
          else if (color.g == fmax)
            hsl.x = (1.0 / 3.0) + deltaR - deltaB; // Hue
          else if (color.b == fmax)
            hsl.x = (2.0 / 3.0) + deltaG - deltaR; // Hue

          if (hsl.x < 0.0)
            hsl.x += 1.0; // Hue
          else if (hsl.x > 1.0)
            hsl.x -= 1.0; // Hue
        }

        return hsl;
      }


`

  const singleDraw = () => {
    return regl({
      vert: `
      precision lowp float;
      attribute vec2 position;
      varying vec2 uv;
      void main () {
        uv = position;
        gl_Position = vec4(2.0 * position - 1.0, 0, 1);
      }`,
      frag: `

    #define PI 3.14159265359;
    #define TAU 6.28318530718;
    #define MOIRE 100.;
    #define amount 8.0;

    precision lowp float;
    uniform sampler2D texture;
    uniform float t;
    uniform float rMod;
    uniform float gMod;
    uniform float bMod;
    uniform float useHSL;
    varying vec2 uv;

    ${glsl}

    void main () {
      vec2 st = uv;
      st.y = 1.- uv.y;
      float l = luma(texture2D(texture,st).rgb);
      vec3 rgbColor = texture2D(texture,st).rgb;
      vec3 hsl = RGBToHSL(rgbColor) * useHSL;

      vec3 outputColor = hsl + (rgbColor * (1. - useHSL));
      // outputColor.r = fract(outputColor.r + rMod);
      // outputColor.g = fract(outputColor.g + gMod);
      // outputColor.b = fract(outputColor.b + bMod);

      float d = abs(outputColor.b - outputColor.r);
      //color.r = color.r + rMod;
      //gl_FragColor = vec4(vec3(d,0,0), 1.);

      gl_FragColor = vec4(outputColor, 1.);

      //gl_FragColor = vec4(vec3(l,color.g,color.b), 1.);
      //gl_FragColor = vec4(color, 1.);
    }
  `,

      attributes: {
        position: [-2, 0, 0, -2, 2, 2],
      },

      uniforms: {
        useHSL: regl.prop("useHSL"),
        rMod: regl.prop("rMod"),
        gMod: regl.prop("gMod"),
        bMod: regl.prop("bMod"),
        texture: textures.video,
        aspect: ({ viewportHeight, viewportWidth }) =>
          viewportWidth / viewportHeight,
        t: ({ tick }) => tick * 0.01,
      },

      count: 3,
    })(props)
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
          draw = false
        }
      }
    })
    return draw
  }

  function drawSingle(assets) {
    if (updateTextures(assets)) {
      setUniforms()

      regl.clear({
        color: [0, 0, 0, 1],
      })

      setupCamera(() => {
        singleDraw({
          texture: textures.mobile,
          uSaturation: 1, //GUI.uSaturation,
          flipX: assets.flipX ? -1 : 1,
        })

        //sdfDraw()
        //  ReglGeometryActions.update()
        //reglMeshGeometry.draw({ texture: textures.mobile })
      })
    }
  }

  function destroy() {
    console.log("destroy")
    regl.destroy()
  }

  const o = {
    useGyroscope: () => {
      renderOptions.useGyroscope = !renderOptions.useGyroscope

      if (!renderOptions.useGyroscope) {
        props.rMod = 0
        props.gMod = 0
        props.bMod = 0
        colorGui.close()
      } else {
        colorGui.open()
      }
    },
    modifyHue: () => {
      renderOptions.modifyHue = !renderOptions.modifyHue
    },
    modifySat: () => {
      renderOptions.modifySat = !renderOptions.modifySat
    },
    modifyLum: () => {
      renderOptions.modifyLum = !renderOptions.modifyLum
    },
    useHSL: () => {
      props.useHSL = !!props.useHSL ? 0 : 1
      const startBtn = document.querySelector(".btn")
      //props.useHSL ? startBtn.style.display = "none" : startBtn.style.display = "block"
    },
  }
}

export default REGL
