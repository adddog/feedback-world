module.exports = (ctx) => ({
  map: ctx.options.map,
  parser: ctx.options.parser || (ctx.file.extname === '.sss' ? 'sugarss' : false),
  plugins: [
    require('postcss-simple-vars')({ root: ctx.file.dirname }),
    require('postcss-import')({ root: ctx.file.dirname }),
    require('postcss-nested')({ root: ctx.file.dirname }),
    require('autoprefixer')({
      browsers: ['last 2 versions',
        'Safari 8',
        'ie > 9'
      ]
    }),
  ]
})
