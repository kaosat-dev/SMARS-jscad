const {cube, cylinder} = require('@jscad/csg/api').primitives3d
const {rotate, translate} = require('@jscad/csg/api').transformations
const {union} = require('@jscad/csg/api').booleanOps

const motorData = require('../data').dimentions.motors.miniGearMotor

const gearMotor = () => {
  return union(
    cube({size: motorData.size, center: true}),
    translate([0, motorData.size[2] / 2 + 10, 0],
      rotate([90, 0, 0], cylinder({d: motorData.axle.diameter, h: motorData.axle.length, center: true}))
    )
  )
}

module.exports = gearMotor
