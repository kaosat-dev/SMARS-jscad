const {cylinder, sphere, cube, torus} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull, chain_hull} = require('@jscad/csg/api').transformations
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
const connector = require('./connectorBase')

const holder = (connectorsCount = 6) => {
  // distance between connectors
  const distance = 8.5
  const connectorThickness = 4
  const connectorsTotalLength = distance * connectorsCount + (connectorsCount + 1) * connectorThickness - connectorThickness

  const cutWidth = 41
  const cutThickness = 2
  const innerCutWidth = 38
  const thickness = 2
  const width = 46
  const height = 10

  const frontBlockLength = Math.max(width, connectorsTotalLength + connectorThickness)

  let holderShape = linearExtrude({height}, union(
    translate([0, -thickness / 2], rectangle({size: [frontBlockLength, thickness], center: true})),
    translate([0, -thickness / 2 - thickness], rectangle({size: [cutWidth, cutThickness], center: true})),
    translate([0, -thickness / 2 - thickness * 2], rectangle({size: [width, thickness], center: true}))

      // rectangle({size: [cutWidth, cutThickness], center: true})
  ))
  /*
  let holderShape = linearExtrude({height}, difference(
    rectangle({size: [cutWidth, cutThickness], center: true}),
    rectangle({size: [innerCutWidth, cutThickness], center: true})
  )) */

  const connectorPlaced = translate([2, 7.5, 5], rotate([90, 0, -90], connector()))

  const connectors = Array(connectorsCount + 1).fill(0).map((_, index) => {
    return translate([(distance + 4) * index, 0, 0], connectorPlaced)
  })
  return union(
    holderShape,
    translate([-connectorsTotalLength / 2, 0, 0], connectors)
  )
}

module.exports = holder
