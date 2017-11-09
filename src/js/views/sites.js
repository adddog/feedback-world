const html = require('choo/html')

module.exports = (sites, emit) => {

  const selected = sites.filter(s=>s.selected)[0]

  return html `
        <iframe src=${selected.url}>
      `
}
