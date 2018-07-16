const {translate} = require('@jscad/csg/api').transformations

// todo , add align on etc
const align = (position, ...shapes) => {
  const bounds = shapes.map(shape => shape.getBounds())
  // console.log('firstBounds', JSON.stringify(bounds))
  const offsets = bounds.map(bound => {
    /* const offset = [
      bounds[0][0].x - bound[0].x,
      bounds[0][0].y - bound[0].y
    ]
    console.log('offset', JSON.stringify(bounds[0][0]),'fbla', JSON.stringify(bound[0])) */
    let offset
    if (position === 'top') {
      offset = bounds[0][0].y - bound[0].y
    } else if (position === 'bottom') {
      offset = bound[0].y - bounds[0][0].y
    }
    return offset
  })

  /* if(position === 'top'){

  } */
  const offsetShapes = shapes.map((shape, index) => {
    return translate([0, offsets[index]], shape)
  })
  console.log('offsets', JSON.stringify(offsets))
  return offsetShapes
}

module.exports = align
