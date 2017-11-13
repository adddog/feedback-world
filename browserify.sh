#!/bin/bash
browserify index.js -t [ envify --NODE_ENV NODE_ENV ] -t babelify --presets [ es2015 stage-0 stage-1 stage-2 ] | uglifyjs > bundle.min.js
