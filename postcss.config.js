module.exports = ctx => ({
  map: ctx.options.map,
  parser:
    ctx.options.parser ||
    (ctx.file.extname === ".sss" ? "sugarss" : false),
  plugins: [
    //require("postcss-modules"),
    require("postcss-import")({ root: ctx.file.dirname }),
    require("postcss-simple-vars")({ root: ctx.file.dirname }),
    //require("postcss-css-variables")({ root: ctx.file.dirname }),
    require("postcss-nested")({ root: ctx.file.dirname }),
    require("postcss-easings")({ root: ctx.file.dirname }),
    require("postcss-extend")({ root: ctx.file.dirname }),
    require("postcss-smart-import")({
      root: ctx.file.dirname,
      path: "src/postcss",
    }),
    require("postcss-font-magician")({
      custom: {
        Stellar: {
          variants: {
            normal: {
              400: {
                url: {
                  woff2: "src/fonts/stellar-light-webfont.woff2",
                  woff: "src/fonts/stellar-light-webfont.woff",
                },
              },
            },
          },
        },
        StellarM: {
          variants: {
            normal: {
              400: {
                url: {
                  woff2: "src/fonts/stellar-medium-webfont.woff2",
                  woff: "src/fonts/stellar-medium-webfont.woff",
                },
              },
            },
          },
        },
      },
    }),
    require("postcss-filters"),
    require("postcss-animations"),
    require("postcss-image-inliner")({
      assetPaths: ["src/"],
      maxFileSize: 1524000,
    }),
    require("autoprefixer")({
      browsers: ["last 2 versions", "Safari 8", "ie > 9"],
    }),
  ],
})
