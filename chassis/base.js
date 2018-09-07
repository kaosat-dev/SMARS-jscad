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

const myMirror = (vector, shape) => {
  let result = shape
  result = vector[0] !== 0 ? mirror([vector[0], 0, 0], result) : result
  result = vector[1] !== 0 ? mirror([0, vector[1], 0], result) : result
  result = vector[2] !== 0 ? mirror([0, 0, vector[2]], result) : result
  return result
}

const dimensions = require('../data').dimentions
const chassisData = dimensions.chassis

const chassis = (params) => {
  console.log('params', params)

  const motorAxleClearance = 2
  const motorData = dimensions.motors[params.motorisation]
  const {size, axles, wallsThickness, pcbCut} = chassisData

  const innerBodySize = [
    ...size.slice(0, -1).map((x, idx) => x - wallsThickness[idx] * 2),
    size[2] - wallsThickness[2]
  ]

  // const motorSize = motorData.size
  const motorZOffset = motorData.size[2] / 2 + wallsThickness[2]
  const motorYPos = motorData.size[1] / 2 + innerBodySize[1] / 2 - motorData.size[1]
  const motorPlacements = [
    { position: [27, motorYPos, motorZOffset], orientation: undefined }, // [0, 0, 0] breaks mirror :()
    { position: [-27, motorYPos, motorZOffset], orientation: [1, 0, 0] }, // [0, 0, 0] breaks mirror :()
    { position: [27, -motorYPos, motorZOffset], orientation: [0, 1, 0] },
    { position: [-27, -motorYPos, motorZOffset], orientation: [1, 1, 0] }
  ]

  const availableMotorMounts = {
    miniGearMotor: require('../motorMounts/gearMotor')(motorData, axles, innerBodySize, wallsThickness),
    servo: () => {}
  }
  const motorMount = availableMotorMounts[params.motorisation]
  const motorMounts = motorPlacements.map(placement => {
    console.log('placement', placement, motorMount)
    const additions = placement.orientation
      ? motorMount.additions.map(addition => translate(placement.position, myMirror(placement.orientation, addition)))
      : motorMount.additions.map(addition => translate(placement.position, addition))

    const removals = placement.orientation
    ? motorMount.removals.map(removal => translate(placement.position, myMirror(placement.orientation, removal)))
    : motorMount.removals.map(removal => translate(placement.position, removal))

    return {additions, removals}
  })

  console.log('motorMounts', motorMounts)

  const axleHoles = motorPlacements.map((placement, index) => {
    console.log('axles', axles, index)
    const axle = motorData.axle
    // from the borders !!
    return translate(placement.position,
      rotate([90, 0, 0], cylinder({d: axle.diameter + motorAxleClearance, center: [true, true, true], h: size[1] * 10, fn: 32}))
    )
  })

  const bodyOutline = roundedRectangle({size, radius: 3})
  let body = difference(
    linear_extrude({height: size[2]}, bodyOutline),
    translate(
        [0, 0, wallsThickness[2]], // offset by size of bottom walls
        cube({size: innerBodySize, center: [true, true, false]})
      )
    ,
    ...axleHoles
  )

  // front
  const frontBackHeight = 15
  const frontBackCutoutOutline = union(
    translate([0, 5], square({size: [42, 10], center: true})),
    translate([0, 12.5],
      square({size: [47, 5], center: true})
    )
  )
  let frontCutBody = translate(
    [innerBodySize[0] / 2, 0, size[2] - frontBackHeight],
    rotate(
      [90, 0, 90],
      linear_extrude({height: wallsThickness[1]}, frontBackCutoutOutline))
  )

  body = difference(
    body,
    color('black', frontCutBody)
  )
  // back
  let backCutBody = translate(
    [-innerBodySize[0] / 2 - wallsThickness[1], 0, size[2] - frontBackHeight],
    rotate(
      [90, 0, 90],
      linear_extrude({height: wallsThickness[1]}, frontBackCutoutOutline))
  )

  body = difference(
    body,
    color('black', backCutBody)
  )
  // top pcb cut, from the original SMARS design
  const pcbCutOffset = [-innerBodySize[0] / 2, pcbCut.position[1], size[2] - pcbCut.position[2] - pcbCut.thickness + 0.5]
  const pcbCutOutline = union(
    square({
      size: [innerBodySize[1] + pcbCut.depth * 2, pcbCut.thickness],
      center: true
    }),
    square({
      size: [innerBodySize[1], 5],
      center: true
    })
  )

  body = difference(
    body,
    color('gray',
      translate(pcbCutOffset, rotate([90, 0, 90], linear_extrude({height: innerBodySize[0] + wallsThickness[0]}, pcbCutOutline)))
    )
  )
  // top side cuts 'v shapes'
  const sideCutBottomLength = 15
  const sideCutTopLength = 27
  const sideCutHeight = 10
  const sideCutsOutline = hull([
    translate([-sideCutBottomLength / 2, 0], circle()),
    translate([sideCutBottomLength / 2, 0], circle()),

    translate([-sideCutTopLength / 2, sideCutHeight], circle()),
    translate([sideCutTopLength / 2, sideCutHeight], circle())
  ])

  const sideCutsOffset = [0, size[1] / 2, size[2] - sideCutHeight]
  const sideCutShape = translate(sideCutsOffset,
    rotate([90, 0, 0],
      linear_extrude({height: wallsThickness[1]}, sideCutsOutline)
    )
  )

  body = difference(
    body,
    sideCutShape,
    mirror([0, 1, 0], sideCutShape)
  )

  // motor mount additions & subtractions
  body = union(body, ...motorMounts.map(x => x.additions))
  body = difference(body, ...motorMounts.map(x => x.removals))

  // battery holder system (cutouts & co)
  const batteryHolderHeight = 6.5
  const batterHolderRoundOffset = 0.5
  const batterySpacing = 15
  const batteriesCount = 2
  const batteryDia = 14
  const batteryDiaCleareance = 0.2
  const batteryConnectorDia = 8.5
  const batteryConnectorHolderThickness = 1
  const batteryConnectorCutoutThickness = 0.8
  const batteryMountWidthDiff = innerBodySize[1] + (batteryConnectorHolderThickness + batteryConnectorCutoutThickness) * 2
  const batterHolderWidth = batterySpacing * (batteriesCount - 1) + batteryDia
  const batteryConnectorCutoutOffset = ((batteriesCount - 1) * batterySpacing) / 2

  const batteryHolderCurvesLength = batteryMountWidthDiff - batteryConnectorHolderThickness
  // to ensore no connection between the two poles, we offset the bottom holder curves
  const batteryHolderCurvesOffset = batteryConnectorHolderThickness

  // main cutout
  const batteryCutoutZ = 2
  const batteryCutout = translate([0, 0, batteryCutoutZ], cube({size: [batterHolderWidth, batteryMountWidthDiff, 50], center: [true, true, false]}))
  body = difference(body, batteryCutout)

  const batterConnectorCutoutShape = hull(
    translate([0, batteryConnectorDia / 2 + batterHolderRoundOffset], circle({r: batteryConnectorDia / 2, center: true})),
    translate([0, batteryConnectorDia + batterHolderRoundOffset], square({size: [batteryConnectorDia, batteryConnectorDia], center: true}))
  )
  const batterConnectorHolderShape = translate([0, batteryHolderHeight / 2], square({size: [batterHolderWidth, batteryHolderHeight], center: true}))
  const allBatteryConnectorCutouts = union(
    Array(batteriesCount).fill(0).map((_, index) => translate([index * (batterySpacing) - batteryConnectorCutoutOffset, 0], batterConnectorCutoutShape))
  )
  const batterConnectorsHolderShape = difference(batterConnectorHolderShape, allBatteryConnectorCutouts)

  console.log('innerBodySize', innerBodySize)
  const batterHolder = color('red', linear_extrude({height: batteryConnectorHolderThickness}, batterConnectorsHolderShape))
  body = union(body,
    translate([0, -innerBodySize[1] / 2, batteryCutoutZ], rotate([90, 0, 0], batterHolder)),
    translate([0, innerBodySize[1] / 2, batteryCutoutZ], mirror([0, 1, 0], rotate([90, 0, 0], batterHolder)))
  )

  const batteryCutoutDia = batteryDia + batteryDiaCleareance
  const batterCutoutShape = hull(
    translate([0, batteryCutoutDia / 2], circle({r: batteryCutoutDia / 2, center: true})),
    translate([0, batteryCutoutDia], square({size: [batteryCutoutDia, batteryCutoutDia], center: true}))
  )
  const allBatteryCutouts = union(
    Array(batteriesCount).fill(0).map((_, index) => translate([index * (batterySpacing) - batteryConnectorCutoutOffset, 0], batterCutoutShape))
  )
  const batteryHolderBottomCurvesShape = difference(
    translate([0, batteryConnectorDia / 2], square({size: [batterHolderWidth + 9, batteryConnectorDia], center: true})),
    allBatteryCutouts
  )
  body = union(
    body,
    translate([0, batteryHolderCurvesLength / 2 - batteryHolderCurvesOffset, 0], rotate([90, 0, 0], linear_extrude({height: batteryHolderCurvesLength}, batteryHolderBottomCurvesShape)))
  )

  // nicer curves for cables
  const cablePassage = translate([0, 0, 10], rotate([0, 90, 0], cylinder({r: 3, h: innerBodySize[0], center: true})))
  body = difference(
    body,
    cablePassage
  )

  if (params.testPrintSlice) {
    /* body = intersection(
      body,
      cube({size: [70, 70, 16], center: [true, true, false]})
    ) */
    body = intersection(
      body,
      translate([30, 0, 0], cube({size: [25, 70, 16], center: [true, true, false]}))
    )
  }

  const motorBlockColor = params.chSeeThrough ? [0.5, 0.5, 0.5, 0.5] : [0.5, 0.5, 0.5]

  let results = []
  if (params.chShowMotorBlock) {
    results = results.concat(color(motorBlockColor, body))
  }
  if (params.chShowCoverBlock) {
    results = results.concat(require('./cover')(size, body, params))
  }

  if (params.chShowBatteries) {
    const batteryShape = require('../battery')
    const batteries = [
      translate([8, -25.5, 10],
        rotate([0, 90, 90], batteryShape())
      ),
      translate([-8, -25.5, 10],
        rotate([0, 90, 90], batteryShape())
      )
    ]
    results = results.concat([...batteries])
  }

  if (params.chShowMotors) {
    const motor = require('../motors/gearMotor')()
    const motors = motorPlacements.map(placement => {
      return placement.orientation
        ? translate(placement.position, myMirror(placement.orientation, motor))
        : translate(placement.position, motor)
    })
    results = results.concat(motors)
  }

  const electronics = translate([0, 0, 20],
    cube({size: [70, 40, 1.6], center: [true, true, false]})
  )
  results = results.concat(
    // electronics
  )

  results = results.concat(
    require('../smars-connectors/holder')()
  )

  return results
}

module.exports = chassis
