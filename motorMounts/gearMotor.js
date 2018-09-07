const {square} = require('@jscad/csg/api').primitives2d
const {cube} = require('@jscad/csg/api').primitives3d
const {hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {union} = require('@jscad/csg/api').booleanOps

const motorMountGearMotor = (motorData, axles, innerBodySize, wallsThickness) => {
  const motorMountsData = [
    {
      notch: {size: [19, 2, 2]},
      blocker: {size: [4, 2, 2]}
    }
  ]
  const motorMounts = motorMountsData
  .map(motorMountData => {
    const motorWidth = motorData.size[0]
    const motorLength = motorData.size[1]
    const motorHeight = motorData.size[2]

    const blockerWidth = 4
    const blockerHeight = 2
    const blockerThickness = 8
    const centralSpacing = 6

    const sidePlatesWidth = 2
    const sidePlatesLength = innerBodySize[1] / 2 - centralSpacing / 2
    const sidePlatesHeight = motorHeight

    const motorNotchLength = motorWidth + 5

    const cutDepth = 1

    const motorNotchOutline = hull(
      translate([-3, 0], square({size: [0.1, 0.1]})),
      translate([0, 0], square({size: [0.1, 0.1]})),
      translate([0, cutDepth], square({size: [0.1, 0.1]}))
    )
    const motorNotch = translate([-motorNotchLength + motorWidth / 2, motorLength / 2 -0.1, motorHeight / 2],
      rotate([0, 90, 0], linear_extrude({height: motorNotchLength}, motorNotchOutline))
    )
    const motorCutout = translate([0, motorLength / 2, 0],
      cube({size: [motorWidth, cutDepth, motorHeight], center: [true, false, true]})
    )

    const motorBlockerOutline = hull(
      translate([-blockerWidth / 2, 0], square({size: [0.1, 0.1]})),
      translate([blockerWidth / 2, 0], square({size: [0.1, 0.1]})),
      translate([blockerWidth / 2 - 0.5, blockerHeight], square({size: [0.1, 0.1]})),
      translate([blockerWidth / 2 - 1.5, blockerHeight], square({size: [0.1, 0.1]}))
    )

    const motorBlockerShape = translate([blockerThickness / 2, 0, 0],
      rotate([90, 0, -90], linear_extrude({height: blockerThickness}, motorBlockerOutline))
    )

    const motorSidePlate = translate([-sidePlatesWidth - motorWidth / 2, centralSpacing / 2, 0], // [-halfOffset, centralSpacing / 2, 0],
      union(
        cube({size: [sidePlatesWidth, sidePlatesLength, sidePlatesHeight]}),
        // back block
        translate([-sidePlatesWidth, 10, 0], cube({size: [4, 6, sidePlatesHeight]}))
      )
    )

    const additions = [
      union(
        translate([0, -motorData.size[1] / 2 - blockerWidth / 2, -motorData.size[2] / 2], motorBlockerShape),
        translate(
          [0, -motorData.size[1] / 2 - wallsThickness[1] / 2, -motorData.size[2] / 2],
          motorSidePlate
        )
      )
    ]
    const removals = [
      union(motorNotch,
      motorCutout)
    ]

    return {
      additions: additions,
      removals: removals
    }
  })

  return motorMounts[0]
}

module.exports = motorMountGearMotor
