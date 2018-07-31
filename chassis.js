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

const chassisData = {
  size: [70, 58, 33],
  wallsThickness: [2, 3, 3], //  front back, left right, bottom
  axles: [
    {
      diameter: 4,
      position: [-27, 0, 7]
    },
    {
      diameter: 4,
      position: [27, 0, 7]
    }
  ],
  frontCut: {
    sizeTop: [42, 18],
    positionTop: [0, 13]
  },
  backCut: {
    sizeTop: [42, 18],
    positionTop: [0, 13]
  },
  pcbCut: {
    thickness: 1,
    depth: 0.5, // depth of cut
    position: [0, 0, 2]// from top
  },
  sideCuts: [
  ],
  motors: [
    {size: [20, 12]},
    {size: [20, 12]}
  ],
  motorMounts: [
    {
      notch: {size: [19, 2, 2]},
      blocker: {size: [4, 2, 2], position: [20, 0, 0]}
    }
  ]
}

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

  let results = [color('gray', body)]
  if(params.chShowCoverBlock){
    const topSize = [30, 30]

    const topHeight = 30
    const topWidth = size[1] + 0
    const chassisTopOutline = hull(
      translate([15, 0], circle({r: 1, center: true})),
      translate([7, 15], circle({r: 12, center: true})),
      // expand
      translate([20, size[0] / 2], roundedRectangle({size: [topHeight, 20], radius: 1})),
      // back
      translate([0, size[0] - 1], roundedRectangle({size: [topHeight, 1], radius: 1}))
    )
    let chassisTop = translate(
      [size[0] / 2, -topWidth / 2, 45],
        rotate([0, 90, 90],
        linear_extrude({height: topWidth}, chassisTopOutline)
      )
    )
    chassisTop = difference(
      chassisTop,
      scale([0.9, 0.85, 0.9], chassisTop)
    )
    chassisTop = difference(
      chassisTop,
      body
    )
    results = results.concat([
      color('orange', translate([0, 0, 1], chassisTop))
    ])
  }

  return results
}

module.exports = chassis
