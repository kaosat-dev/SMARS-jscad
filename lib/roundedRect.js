const {circle} = require('@jscad/csg/api').primitives2d
const {translate, hull} = require('@jscad/csg/api').transformations

const rectangle = (params) => {
  const defaults = {size: [1, 1], radius: 0.0001}
  const {radius, size} = Object.assign({}, defaults, params)

  const [width, length] = size.map(x => x * 0.5)
  return hull(
    translate([-width + radius, -length + radius], circle({r: radius, center: true})),
    translate([width - radius, -length + radius], circle({r: radius, center: true})),
    translate([width - radius, length - radius], circle({r: radius, center: true})),
    translate([-width + radius, length - radius], circle({r: radius, center: true}))
  )
}

module.exports = rectangle
