const {translate} = require('@jscad/csg/api').transformations

const center = (axes = [1, 1, 1], ...shapes) => {
  let minX = +Infinity
  let maxX = -Infinity
  // TODO flatten/to array
  shapes = shapes[0]

  shapes.forEach(shape => {
    const bounds = shape.getBounds()

    if (bounds[0].x < minX) {
      minX = bounds[0].x
    }
    if (bounds[1].x > maxX) {
      maxX = bounds[1].x
    }
  })

  let offset = [(maxX - minX) * 0.5, 0]
  offset[0] = offset[0] + shapes[0].getBounds()[0].x
  return shapes.map(shape => translate(offset, shape))
}

module.exports = center
