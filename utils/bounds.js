
const api = require('@jscad/csg/api')
// api workaround for now you would use
// const {measureBounds} = require('@jscad/csg/api').measurements

const getBounds = shape => {
  // we have vtree api if true
  if (api.measurements) {
    // console.log('using api for measurebounds')
    return api.measurements.measureBounds(shape)
  }
  return shape.getBounds()
}

module.exports = getBounds
