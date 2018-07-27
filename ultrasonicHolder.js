const {circle} = require('@jscad/csg/api').primitives2d
const {cylinder} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {union, difference, intersection} = require('@jscad/csg/api').booleanOps

const rectangle = require('./lib/roundedRect')

const fs = require('fs')
const bar = fs.readFileSync('SMARS-jscad/foo.txt')
console.log('here', bar)

module.exports = function ultrasonicSensorHolder (params) {
  const topBottomWallsThickness = 4
  const sideWallsThickness = [5, 3]
  const pcbCleareance = 0.4
  const sensorClearance = 0.5
  const sideCutSize = [8, 11]
  const sideCutDistance = 43

  const {sensors, board, connectors} = params.ultrasonicSensor
  const centerPilonHeight = sensors[0].height // TODO: reduce & get max
  const centerPilonDiameter = 5
  const totalHeight = board.size[2] + sensors[0].height + 3

  const sensorsShapes = sensors.map(sensor => {
    return translate(sensor.position, circle({r: (sensor.diameter + sensorClearance) / 2, center: true}))
  })

  const pcbShape = rectangle({size: board.size.map(dim => dim + pcbCleareance)})
  const pilonShape = circle({r: centerPilonDiameter / 2, center: true})

  const sideCuts = [
    translate([sideCutDistance / 2 + sideCutSize[0] / 2, 0], rectangle({size: sideCutSize, radius: 0.01})),
    translate([-sideCutDistance / 2 - sideCutSize[0] / 2, 0], rectangle({size: sideCutSize, radius: 0.01}))
  ]
  const bodyShape = difference(
    rectangle({size: board.size.map((x, index) => x + sideWallsThickness[index] + pcbCleareance), radius: 5}),
    ...sideCuts
  )

  const connectorsCutoutShape = rectangle({size: connectors[0].size})

  const sides = difference(bodyShape, pcbShape)
  const front = difference(bodyShape, ...sensorsShapes)

  let sensorHolder = union(
    linear_extrude({height: totalHeight}, sides),
    linear_extrude({height: topBottomWallsThickness}, front)
  )

  // center pilon, to hold the sensor board, optional
  if (params.usPilon && sensors.length > 1) {
    sensorHolder = union(
      sensorHolder,
      translate(
        [0, 0, topBottomWallsThickness],
        linear_extrude({height: centerPilonHeight - topBottomWallsThickness}, pilonShape)
      )
    )
  }

  
  // connectors cutout, optional
  if (params.usConnectorCutout) {
    sensorHolder = difference(
      sensorHolder,
      translate(
        [0, 11, totalHeight - 4],
        linear_extrude({height: 4}, connectorsCutoutShape)
      )
    )
  }

  if (params.usTestSlice) {
    return intersection(
      sensorHolder,

      translate([0, 0, 0],
        linear_extrude({height: 1}, rectangle({size: [100, 50]}))
      )
    )
  }


  return sensorHolder

  let results = [
    sides,
    front
    // sideCuts[0]
  ]

  results = params.showBottom ? results.concat(
    sensorHolder
  ) : results

  return results
}
