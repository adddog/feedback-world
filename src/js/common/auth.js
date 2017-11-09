import queryString from "query-string"

const AUTH_SERVICE = (() => {
  const ERROR_TYPES = {
    INCOMPLETE: "INCOMPLETE",
    MISMATCH: "MISMATCH",
    STORE_VIDEO_FAILED: "STORE_VIDEO_FAILED",
  }

  /*
  LOGIN
  */

  function auth(url) {
    return new Promise((yes, no) => {
      let newWindow = window.open(
        url,
        null,
        "height=700,width=600,status=yes,toolbar=no,menubar=no,location=no"
      )

      let _i = setInterval(() => {
        if(newWindow){
          if (newWindow.location) {
            let url = newWindow.location.href || newWindow.location
            let success = url.indexOf("success") > -1
            if (success) {
              clearInterval(_i)
              let _str = url.split("success?")[1]
              const parsedHash = queryString.parse(_str)
              newWindow.close()
              newWindow = null
              yes(parsedHash)
            }
          }
        }
      }, 200)
    })
  }

  return {
    auth: auth,
    ERROR_TYPES: ERROR_TYPES,
  }
})()

export default AUTH_SERVICE
