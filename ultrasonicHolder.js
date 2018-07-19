const {circle} = require('@jscad/csg/api').primitives2d
const {cylinder} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {union, difference, intersection} = require('@jscad/csg/api').booleanOps

const rectangle = require('./lib/roundedRect')

module.exports = function ultrasonicSensorHolder (params) {
  const topBottomWallsThickness = 4
  const sideWallsThickness = 7
  const pcbCleareance = 0.1
  const sideCutSize = [8, 10]
  const sideCutDistance = 43

  const {sensors, board} = params.ultrasonicSensor
  const centerPilonHeight = sensors[0].height // TODO: reduce & get max
  const centerPilonDiameter = 5
  const totalHeight = board.size[2] + sensors[0].height + 3

  const sensorsShapes = sensors.map(sensor => {
    return translate(sensor.position, circle({r: sensor.diameter / 2, center: true}))
  })

  const pcbShape = rectangle({size: board.size.map(x => x + pcbCleareance)})
  const pilonShape = circle({r: centerPilonDiameter / 2, center: true})

  const sideCuts = [
    translate([sideCutDistance / 2 + sideCutSize[0] / 2, 0], rectangle({size: sideCutSize, radius: 0.01})),
    translate([-sideCutDistance / 2 - sideCutSize[0] / 2, 0], rectangle({size: sideCutSize, radius: 0.01}))
  ]
  const bodyShape = difference(
    rectangle({size: board.size.map(x => x + sideWallsThickness + pcbCleareance), radius: 10}),
    ...sideCuts
  )

  const sides = difference(bodyShape, pcbShape)
  const front = difference(bodyShape, ...sensorsShapes)

  const sensorHolder = union(
    linear_extrude({height: totalHeight}, sides),
    linear_extrude({height: topBottomWallsThickness}, front),
    translate(
      [0, 0, topBottomWallsThickness],
      linear_extrude({height: centerPilonHeight - topBottomWallsThickness}, pilonShape)
    )
  )

  return intersection(
    sensorHolder,

    translate([0, 0, 0],
      linear_extrude({height: 1}, rectangle({size: [100, 50]}))
    )
  )
  return [
    sides,
    front,

    linear_extrude({height: totalHeight}, sides),
    linear_extrude({height: topBottomWallsThickness}, front),
    translate(
      [0, 0, topBottomWallsThickness],
      linear_extrude({height: centerPilonHeight - topBottomWallsThickness}, pilonShape)
    )
    // sideCuts[0]
  ]
  // return rectangle({})
  /* const centerPilon = linear_extrude({height: centerPilonHeight}, circle({r: 5}))
  const sensorCutouts = params.ultrasonicSensor.sensors.map(sensor => {
    linear_extrude({height: 3}, circle({r: sensor.diameter / 2}))
  })
  const bodyOuter = linear_extrude(
    {height: thickness},
    rectangle({round: true})
  )
  const body = difference(
    union([centerPilon, bodyOuter])
    sensorCutouts
  )

  return */
}
