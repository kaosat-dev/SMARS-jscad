const {cylinder, sphere, cube} = require('@jscad/csg/api').primitives3d
const {rotate, translate, scale, mirror, contract, expand} = require('@jscad/csg/api').transformations
const {union, difference, intersection} = require('@jscad/csg/api').booleanOps

const {flatten} = require('./arrays')
const align = require('./utils/align')
const distribute = require('./utils/distribute')
const center = require('./utils/center')
const extractCenterPosition = require('./utils/extractCenterPosition')

const roundedRectangle = require('./lib/roundedRect')

const {dimentions} = require('./data')
const batteries = dimentions.batteries
const electronics = dimentions.electronics

const battery = () => {
  const dims = batteries.AA
  // console.log('foo', dims.size)
  return union(
    cylinder({d: dims.size[1], h: dims.size[0]}),
    translate([0, 0, dims.size[0]], cylinder({d: dims.plus[1], h: dims.plus[0]}))
  )
}

module.exports = battery
