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

const chassisCover = (size, body, params) => {
  const topSize = [30, 30]

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

  const electronics = require('../data').dimentions.electronics.D1_trippler_base
  const pcbHolder = translate([0, 0, 33],
    cube({size: [electronics.board.size[0] + 10, topCoverWidth + 2, 2], center: [true, true, false]})
  )
  //
  chassisTop = difference(chassisTop, pcbHolder)

  const chassisTopColor = params.chSeeThrough ? [1, 0.7, 0.05, 0.6] : [1, 0.7, 0.05]

  const pcbOutline = cube({size: electronics.board.size, center: [true, true, false]})

  return[
    // color(chassisTopColor, translate([0, 0, 0], chassisTop)),
    // color('gray', chassisTopCover),
    // translate([0, 0, 33], rotate([0, 0, 90], pcbOutline))
  ]
}

module.exports = chassisCover
