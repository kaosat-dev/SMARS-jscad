const {translate} = require('@jscad/csg/api').transformations
const getBounds = require('./bounds')

const distribute = (spreadType = 'leftToRight', ...shapes) => {
  // TODO flatten/to array
  shapes = shapes[0]
  const offsetShapes = shapes.slice(1).map((shape, index) => {
    let offset
    const prevShape = shapes[index]

    if (spreadType === 'leftToRight') {
      const bounds = getBounds(shape)
      const prevBounds = getBounds(prevShape)
      offset = bounds[0].x - prevBounds[1].x
    }
    return translate([offset, 0], shape)
  })

  return [shapes[0]].concat(offsetShapes)
}

module.exports = distribute
