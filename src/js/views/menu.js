const html = require('choo/html')

const generateEls = (sites, emit) => (html `
  <li
    class="sites--item ${sites.selected ? "selected" : ""}"
    onclick=${()=>(emit("site-clicked",sites.label))}
  >${sites.label}</li>`)

module.exports = (sites, emit) => {
  return html `
        <ul>
            ${[...sites.map(s=>generateEls(s,emit))]}
        </ul>
      `
}
