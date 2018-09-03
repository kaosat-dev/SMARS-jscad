const {circle, square} = require('@jscad/csg/api').primitives2d
const {cylinder, sphere, cube, torus} = require('@jscad/csg/api').primitives3d
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

const chassisData = require('./data').dimentions.chassis

const chassis = (params) => {
  const {size, axles, wallsThickness, pcbCut, motors} = chassisData
  const innerBodySize = [
    ...size.slice(0, -1).map((x, idx) => x - wallsThickness[idx] * 2),
    size[2] - wallsThickness[2]
  ]

  const axleHoles = axles.map(axle => {
    // from the borders !!
    return translate(axle.position,
      rotate([90, 0, 0], cylinder({d: axle.diameter, center: [true, true, true], h: size[1] * 10, fn: 32}))
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

  const sideCutBottomLength = 15
  const sideCutTopLength = 27
  const sideCutHeight = 10
  const sideCutsOutline = hull([
    translate([-sideCutBottomLength / 2, 0], circle()),
    translate([sideCutBottomLength / 2, 0], circle()),

    translate([-sideCutTopLength / 2, sideCutHeight], circle()),
    translate([sideCutTopLength / 2, sideCutHeight], circle())
  ])

  // sidecuts
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

  // motor
  const motorMountsData = chassisData.motorMounts

  const motorMounts = motorMountsData
    .map(motorMountData => {
      const motor = motors[0]
      const motorWidth = motor.size[1]

      const blockerWidth = 4
      const blockerHeight = 2
      const blockerThickness = 8
      const centralSpacing = 6
      const sidePlatesHeight = 6

      const cutDepth = 1

      const halfOffset = innerBodySize[0] / 2 - motorWidth
      const motorNotchOutline = hull(
        translate([-3, 0], square({size: [0.1, 0.1]})),
        translate([0, 0], square({size: [0.1, 0.1]})),
        translate([0, cutDepth], square({size: [0.1, 0.1]}))
      )
      const motorNotch = translate([-halfOffset - motorWidth, innerBodySize[1] / 2, wallsThickness[2] + sidePlatesHeight],
        rotate([0, 90, 0], linear_extrude({height: motorWidth + 5}, motorNotchOutline))
      )
      const motorCutout = translate([-halfOffset - motorWidth, innerBodySize[1] / 2, wallsThickness[2]],
        cube({size: [motorWidth, cutDepth, sidePlatesHeight]})
      )

      const motorBlockerOutline = hull(
        translate([-blockerWidth / 2, 0], square({size: [0.1, 0.1]})),
        translate([blockerWidth / 2, 0], square({size: [0.1, 0.1]})),
        translate([blockerWidth / 2 - 0.5, blockerHeight], square({size: [0.1, 0.1]})),
        translate([blockerWidth / 2 - 1.5, blockerHeight], square({size: [0.1, 0.1]}))
      )

      const motorBlockerShape = translate([axles[0].position[0] + blockerThickness / 2, blockerWidth / 2 + 2, wallsThickness[2]],
        rotate([90, 0, -90], linear_extrude({height: blockerThickness}, motorBlockerOutline))
      )

      const motorSidePlate = translate([-halfOffset, centralSpacing / 2, wallsThickness[2]],
        union(
          cube({size: [2, innerBodySize[1] / 2 - centralSpacing / 2, sidePlatesHeight]}),
          // back block
          translate([0, 10, 0], cube({size: [4, 6, sidePlatesHeight]}))
        )
      )
      const additions = union(
        motorBlockerShape,
        motorSidePlate
      )
      const removals = union(
        motorNotch,
        motorCutout
      )

      return {
        additions: union(
          additions,
          mirror([0, 1, 0], additions),
          mirror([1, 0, 0], additions),
          mirror([0, 1, 0], mirror([1, 0, 0], additions))
        ),
        removals: union(
          removals,
          mirror([0, 1, 0], removals),
          mirror([1, 0, 0], removals),
          mirror([0, 1, 0], mirror([1, 0, 0], removals))
        )
      }
    })

  body = union(
    body,
    ...motorMounts.map(x => x.additions)
  )

  body = difference(
    body,
    ...motorMounts.map(x => x.removals)
  )
  const motorBlockColor = params.chSeeThrough ? [0.5, 0.5, 0.5, 0.5] : [0.5, 0.5, 0.5]

  let results = []
  if (params.chShowMotorBlock) {
    results = results.concat(color(motorBlockColor, body))
  }
  if (params.chShowCoverBlock) {
    const topSize = [30, 30]

    const batteryShape = require('./battery')
    const batteries = [
      translate([-25, 10, 20],
        rotate([0, 90, 0], batteryShape())
      ),
      translate([-25, -10, 20],
        rotate([0, 90, 0], batteryShape())
      )
    ]
    /* const batteries = [
      translate([10, 25, 20],
        rotate([90, 0, 0], batteryShape())
      ),
      translate([-10, 25, 20],
        rotate([90, 0, 0], batteryShape())
      )
    ] */

    const topHeight = 30
    const topWallsThickness = 4
    const topWidth = size[1]
    const topCoverWidth = topWidth - 2 * topWallsThickness
    const topCoverHeight = 30

    const chassisTopHolderOutline = hull(
      // rounded front parts
      // translate([15, 0], circle({r: 1, center: true})),
      // translate([7, 15], circle({r: 12, center: true})),

      translate([5, -size[0] / 2 - 5], roundedRectangle({size: [topHeight / 2, 1], radius: 1})),
      // inner notch
      translate([20, 0], roundedRectangle({size: [topHeight, 20], radius: 1})),
      // back
      translate([5, size[0] / 2 + 5], roundedRectangle({size: [topHeight / 2, 1], radius: 1}))
    )
    let chassisTopHolder = translate(
      [0, -topWidth / 2, 45],
        rotate([0, 90, 90],
        linear_extrude({height: topWallsThickness}, chassisTopHolderOutline)
      )
    )
    chassisTopHolder = difference(
      chassisTopHolder,
      body
    )

    let chassisTopCoverOutline = hull(
      translate([5, -size[0] / 2 - 5], roundedRectangle({size: [topHeight / 2, 1], radius: 1})),
      translate([5, size[0] / 2 + 5], roundedRectangle({size: [topHeight / 2, 1], radius: 1}))
    )

    chassisTopCoverOutline = difference(
      chassisTopCoverOutline,
      translate([2, 0, 0], scale([0.999, 0.95, 0.9], chassisTopCoverOutline))
    )

    let chassisTopCover = translate(
      [0, -topCoverWidth / 2, 45],
        rotate([0, 90, 90],
      linear_extrude({height: topCoverWidth}, chassisTopCoverOutline)
    ))

    const topCoverHoles = Array(7).fill(0)
      .map((_, index) => {
        return translate([index * 10, -10, 0],
          rotate([0, 0, -30], roundedRectangle({size: [2, 15], radius: 0.5})))
      })
      .map(shape => translate([-30, 0, 45], linear_extrude({height: 5}, shape)))
      .map(shape => color('red', shape))

    /// //////
    let bigThing = 40
    const shellSize = [50, 110, 10] // 63
    const shellTopThickness = 3
    const shellOutline = hull(
      // front
      translate([-shellSize[0] / 2, 0], roundedRectangle({size: [20, 55], radius: 3})),
      // sides
      translate([-0, bigThing], roundedRectangle({size: [40, 10], radius: 3})),
      translate([-0, -bigThing], roundedRectangle({size: [40, 10], radius: 3})),
      // back
      translate([shellSize[0] / 2, 0], roundedRectangle({size: [20, 55], radius: 3}))
    )
    const shellSidesOutline = difference(
      shellOutline,
      contract(2.5, 1, shellOutline)
    )
    let shellSides = union(
      linear_extrude({height: shellSize[2]}, shellSidesOutline)
    )
    let shellTop = translate([0, 0, shellSize[2] - shellTopThickness], linear_extrude({height: shellTopThickness}, shellOutline))
    const shellShape = translate([0, 0, 45 - 10 + 3 ], union(shellSides, shellTop))
    chassisTopCover = shellShape // union(shellShape,chassisTopCover)

    /// ///

    chassisTopCover = difference(
      chassisTopCover,
      topCoverHoles,
      mirror([0, 1, 0], topCoverHoles)
    )

    let chassisTop = union(
      chassisTopHolder,
      mirror([0, 1, 0], chassisTopHolder)
    )

    const electronics = require('./data').dimentions.electronics.D1_trippler_base
    const pcbHolder = translate([0, 0, 33],
      cube({size: [electronics.board.size[0] + 10, topCoverWidth + 2, 2], center: [true, true, false]})
    )
    //
    chassisTop = difference(chassisTop, pcbHolder)

    const chassisTopColor = params.chSeeThrough ? [1, 0.7, 0.05, 0.6] : [1, 0.7, 0.05]

    const pcbOutline = cube({size: electronics.board.size, center: [true, true, false]})

    results = results.concat([
      //color(chassisTopColor, translate([0, 0, 0], chassisTop)),
      ...batteries,
      //color('gray', chassisTopCover),
      //translate([0, 0, 33], rotate([0, 0, 90], pcbOutline))
    ])
  }

  if (params.chShowMotors) {
    // pololu geared motor
    const motorData = {
      dimensions: {
        size: [12, 9 + 15, 10],
        axle: {diameter: 2.5, length: 10}
      }
    }
    const motor = translate([27, 15, 7],
        union(
        cube({size: motorData.dimensions.size, center: true}),
        translate([0, motorData.dimensions.size[2] / 2 + 10, 0],
          rotate([90, 0, 0], cylinder({d: motorData.dimensions.axle.diameter, h: motorData.dimensions.axle.length, center: true}))
        )
      )
    )
    results = results.concat([
      motor,
      mirror([0, 1, 0], motor),
      mirror([1, 0, 0], motor),
      mirror([0, 1, 0], mirror([1, 0, 0], motor))
    ])
  }
  return results
}

module.exports = chassis
