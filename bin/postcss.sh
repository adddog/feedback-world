#!/bin/bash
postcss src/postcss/index.sss -o main.css && cssnano < main.css > main.min.css