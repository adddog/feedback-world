const html = require('choo/html')
import { fromPairs, map, forIn } from 'lodash'


module.exports = (state, emit) => {

  if (!state.images.length) return null


  const onload = (el) => {

    const regl = require('regl')(el)

    console.log(state.images);

    const drawImage = regl({
      frag: `
        precision mediump float;

        ${state.images.map((v,i) => `uniform sampler2D texture${i};\n`).join('\n')}

        varying vec2 uv;
        void main () {
          gl_FragColor = texture2D(texture0, uv);
        }`,

            vert: `
        precision mediump float;
        attribute vec2 position;
        varying vec2 uv;
        void main () {
          uv = position;
          gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
        }`,

      attributes: {
        position: [-2, 0,
          0, -2,
          2, 2
        ]
      },

      uniforms: {
        texture0:regl.prop('0')
      },

      count: 3
    })

    require('resl')({

      manifest:
        fromPairs(map(state.images, (val, i) => [i, {
          type: 'image',
          src: val
        }]))
      ,

      onDone: (assets) => {
        const textures = {}
        forIn(assets, (val, name) => textures[name] = regl.texture(val))
        drawImage({...textures})
      },
      // As assets are preloaded the progress callback gets fired
      onProgress: (progress, message) => {},

      onError: (err) => {}
    })

  }

  return html `
        <div class="webgl">
          <canvas
          class="drawing-canvas"
          onload=${onload}
          >
          </canvas>
        </div>
      `
}
