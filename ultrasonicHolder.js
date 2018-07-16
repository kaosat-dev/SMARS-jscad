const {circle, rectangle} = require('@jscad/csg/api').primitives2d
const {cylinder} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {union, difference} = require('@jscad/csg/api').booleanOps

module.exports = function ultrasonicSensorHolder (params) {
  const centerPilonHeight = 10
  const {offset, diameter, thickness} = params.ultrasonicSensor

  return cylinder({r: 10, h:30})
  /*const centerPilon = linear_extrude({height: centerPilonHeight}, circle({r: 5}))
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
