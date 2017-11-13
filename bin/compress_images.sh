#!/bin/bash
for i in src/images/*.png; do pngquant --force --ext .png --quality=85-100 $i; done
