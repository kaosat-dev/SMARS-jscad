const {circle, square} = require('@jscad/csg/api').primitives2d
const {cylinder, sphere, cube, torus} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull, chain_hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, scale, mirror, contract, expand} = require('@jscad/csg/api').transformations
const {union, difference, intersection} = require('@jscad/csg/api').booleanOps

const {flatten} = require('../arrays')
const align = require('../utils/align')
const distribute = require('../utils/distribute')
const center = require('../utils/center')
const extractCenterPosition = require('../utils/extractCenterPosition')
// const {enlarge} = require('./lib/scaleAbs')
const roundedRectangle = require('../lib/roundedRect')

const {rectangle, ellipse} = require('../lib/V2mock/primitives2d')
const {linearExtrude} = require('../lib/V2mock/extrusions')

const smarsConnector = () => {
  const holeDiameter = 5
  const diameter = 10
  const thickness = 4

  const rimCenter = (diameter - holeDiameter) / 2 + holeDiameter

  const gripperPinDia = 1
  const gripperPinHeight = 0.5
  const gripperPinsCount = 8
  const gripperPinsOffset = 360 / gripperPinsCount

  const baseShape = difference(
      hull([
        ellipse({r: diameter / 2, center: true}),
        translate([diameter / 2, 0], rectangle({size: [diameter / 2, diameter], center: true}))
      ]),
      ellipse({r: holeDiameter / 2, center: true})
  )
  const connector = linearExtrude({height: thickness}, baseShape)
  const gripperPins = union(Array(gripperPinsCount).fill(gripperPinDia).map((_, index) => {
    return linearExtrude({height: gripperPinHeight},
      rotate([0, 0, index * gripperPinsOffset], translate([rimCenter / 2, 0], ellipse({r: gripperPinDia / 2, center: true})))
    )
  })
  )
  return union(
    connector,
    translate([0, 0, thickness], gripperPins),
    translate([0, 0, -gripperPinHeight], gripperPins)
  )
}

module.exports = smarsConnector
