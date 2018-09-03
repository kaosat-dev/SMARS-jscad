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
      diameter: 3,
      rimDiameter: 7,
      rimHeight: 0.5,

      frontRecessDepth: 10,
      frontRecessDiameter: 6,
      frontRecessSpokes: 6,
      frontRecessSpokesWidth: 4
    },
    spikes: {
      amount: 8,
      diameter: 7,
      height: 2
    },
    frontNotches: {
      amount: 6
    },
    tracks: {
      amount: 6
    }
  }
  const {diameter, thickess, axle, spikes} = wheelData

  const spikeShape = rotate([90, 0, 0], cylinder({h: spikes.height, d2: spikes.diameter, d1: spikes.diameter / 3, fn: 4}))
  const spikeShapes = Array(spikes.amount).fill(spikes)
    .map((spikeData, index) => {
      const unitRotation = 360 / spikeData.amount * index
      const modShape = translate([0, diameter / 2, thickess / 2], spikeShape)
      return rotate([0, 0, unitRotation + 20], modShape)
    })

  const wheelOutline = difference(
    circle({r: diameter / 2, fn: spikes.amount, center: true}),
    circle({r: axle.diameter / 2, center: true})
  )

  let wheel = linear_extrude({height: thickess}, wheelOutline)
  wheel = union(
    wheel,
    cylinder({h: spikes.height, d1: diameter, d2: diameter - 2}),
    translate([0, 0, thickess - spikes.height], cylinder({h: spikes.height, d2: diameter, d1: diameter - 2})),
    ...spikeShapes
  )
  
  // add axle rim
  const axleRim = cylinder({d: axle.rimDiameter, center: [true, true, false], h: axle.rimHeight})
  wheel = union(
    wheel,
    translate([0, 0, -axle.rimHeight], axleRim)
  )

  // cut the axle
  wheel = difference(
    wheel,
    translate([0, 0, -axle.rimHeight],
      cylinder({d: axle.diameter, center: [true, true, false], h: thickess + axle.rimHeight})
    )
  )

  // add front spokes
  const spokeShape = linear_extrude({height: 5}, roundedRectangle({size: [4, diameter / 3], radius: 2}))
  let spokeShapes = Array(axle.frontRecessSpokes).fill(axle)
    .map((axleData, index) => {
      const unitRotation = 360 / axleData.frontRecessSpokes * index
      const modShape = translate([0, diameter / 2 - 5, thickess / 2 + 5], spokeShape)
      return rotate([0, 0, unitRotation], modShape)
    })


  // remove stuff sticking out
  spokeShapes = intersection(
    wheel,
    union(spokeShapes)
  )
  // add front recess/cuts
  wheel = difference(
    wheel,
    // deep cut
    translate([0, 0, thickess - axle.frontRecessDepth],
      cylinder({d: axle.frontRecessDiameter, h: axle.frontRecessDepth})
    ),
    // cone
    translate([0, 0, thickess - axle.frontRecessDepth + 5],
      cylinder({d1: axle.frontRecessDiameter, d2: diameter - 1, h: 5})
    )
  )

  wheel = union(
    wheel,
    spokeShapes
  )

  return color('orange', wheel)
}

const track = params => {
  const trackData = {
    width: 16,
    length: 12,
    thicknes: 4,
    body: {
      size: [12, 16, 3.5]
    },
    innerNotch: {
      offset: 4,
      size: [5, 5, 4]
    },
    mountHole: {
      diameter: 2
    },
    wheelHole: {
      diameter: 7,
      segments: 4
    }
  }
  const {body, innerNotch, mountHole, wheelHole} = trackData

  const blockDiameter = body.size[2]
  const bodyLength = body.size[0]
  const holeOffset = bodyLength / 2 - blockDiameter / 2
  const sideBlocksWidth = (body.size[1] - innerNotch.size[1]) / 2

  console.log('sideBlocksWidth', sideBlocksWidth)

  let sideOutline = hull(
    translate([bodyLength / 2 - blockDiameter / 2, 0, 0], circle({r: blockDiameter / 2, center: true})),
    translate([-bodyLength / 2 + blockDiameter / 2, 0, 0], circle({r: blockDiameter / 2, center: true}))
  )
  sideOutline = difference(
    sideOutline,
    translate([holeOffset, 0, 0], circle({r: mountHole.diameter / 2, center: true}))
  )

  const sideShape = rotate([90, 0, 0], linear_extrude({height: sideBlocksWidth}, sideOutline))

  let trackBody = union(
    translate([0, 0, 0], sideShape),
    mirror([1, 0, 0], translate([innerNotch.offset, sideBlocksWidth, 0], sideShape)),
    translate([0, sideBlocksWidth + innerNotch.size[1], 0], sideShape)
  )
  trackBody = translate([0, -innerNotch.size[1] / 2, innerNotch.size[2] / 2], trackBody)
  trackBody = difference(
    trackBody,
    cylinder({d: wheelHole.diameter, h: 5, fn: wheelHole.segments})
  )

  return trackBody
}

const drive = (params) => {
  const driveTypes = {
    trackedWheel: trackedWheel
  }
  const selectedDrive = driveTypes[params.mType]
  if (!selectedDrive) {
    throw new Error(`Sorry ! "${params.mType}" is not available as a drive type`)
  }
  // return selectedDrive(params)

  /* const wheels = Array(params.drives.amount).fill(0)
    .map( _ => {
      return selectedDrive(params)
    }) */
  //return track()
  const baseWheel = translate([25, -30, 5], rotate([90, 0, 0], selectedDrive(params)))
  const wheel1 = baseWheel
  const wheel2 = mirror([1, 0, 0], wheel1)

  const wheel3 = mirror([0, 1, 0], baseWheel)
  const wheel4 = mirror([0, 1, 0], mirror([1, 0, 0], wheel1))
  // const result =
  // console.log('result', result)
  const wheels = [wheel1, wheel2, wheel3, wheel4]
  return wheels
}

module.exports = drive
