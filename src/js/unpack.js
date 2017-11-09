import Q from 'bluebird'

var ndarray = require("ndarray")

//FIXME:  This is broken in FF/Safari, there is a slight race condition when loading PNG images

function unpack(str, ext) {
  return new Q((yes,no)=>{
    var canvas = document.createElement("canvas")
    var img = new Image()
    img.src = `data:image/${ext};base64,` + str
    img.onload = ()=>{
      yes(img.src)
      /*canvas.width = img.width
      canvas.height = img.height
      var context = canvas.getContext("2d")
      context.drawImage(img, 0, 0)
      var pixels = context.getImageData(0, 0, img.height, img.width)
      yes(ndarray(pixels.data, [img.width, img.height, 4], [4, 4*img.width, 1], 0))*/
    }
  })
}

module.exports = unpack