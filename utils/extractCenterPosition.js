const getBounds = require('./bounds')

const extractCenterPosition = (shape) => {
  const bounds = getBounds(shape)
  const position = [bounds[1].x + bounds[0].x, bounds[1].y + bounds[0].y].map(x => x * 0.5)
  console.log('bounds', bounds, position)
  return position
}

module.exports = extractCenterPosition
