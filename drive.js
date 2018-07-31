const {circle, square} = require('@jscad/csg/api').primitives2d
const {cylinder, sphere, cube} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull, chain_hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, scale, mirror, contract, expand} = require('@jscad/csg/api').transformations
const {union, difference, intersection} = require('@jscad/csg/api').booleanOps

const {flatten} = require('./arrays')
const align = require('./utils/align')
const distribute = require('./utils/distribute')
const center = require('./utils/center')
const extractCenterPosition = require('./utils/extractCenterPosition')
// const {enlarge} = require('./lib/scaleAbs')

const roundedRectangle = require('./lib/roundedRect')

const trackedWheel = (params) => {
  const wheelData = {
    diameter: 31,
    thickess: 20,
    axle: {
      diameter: 3
    },
    spikes: {
      amount: 20,
      size: 10
    }
  }
  const {diameter, thickess} = wheelData
  const wheel = color('orange', linear_extrude({height: thickess}, circle({r: diameter / 2})))

  return translate([10, -30, -10], rotate([90, 0, 0], wheel))
}

const drive = (params) => {
  const driveTypes = {
    trackedWheel: trackedWheel
  }
  const selectedDrive = driveTypes[params.mType]
  if (!selectedDrive) {
    throw new Error(`Sorry ! "${params.mType}" is not available as a drive type`)
  }
  const result = selectedDrive(params)
  console.log('result', result)
  return result
}

module.exports = drive
