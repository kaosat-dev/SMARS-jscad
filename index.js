const {rotate, translate, mirror} = require('@jscad/csg/api').transformations

// const servo = require('./servo')
// const bodyTop = require('./bodyTop')
// const bodyBottom = require('./bodyBottom')
const ultrasonicSensorHolder = require('./ultrasonicHolder')
const ultrasonicSensors = require('./ultrasonicSensors')
const emmiter = require('./emmiter')

const paramDefaults = {
  quality: 120,
  robotName: 'ISOLOS',
  ultrasonicSensor: {model: 'us100'}
}

function getParameterDefinitions () {
  return [
    { name: 'mainParams', type: 'group', caption: 'Main parameters' },
    { name: 'visualParams', type: 'group', caption: 'Visual toggles' },

    { name: 'showTop', type: 'checkbox', checked: false, caption: 'Show top:' },
    { name: 'showBottom', type: 'checkbox', checked: false, caption: 'Show bottom:' },
    { name: 'showMotors', type: 'checkbox', checked: false, caption: 'Show mounts:' }
  ]
}

function main (params) {
  console.log('initial params', params)
  params = Object.assign({}, paramDefaults, params)
  params = Object.assign({}, params, {ultrasonicSensor: ultrasonicSensors[params.ultrasonicSensor.model]})
  let results = []
  // results = results.concat(ultrasonicSensorHolder(params))
  results = results.concat(emmiter(params))
  /* results = params.showTop ? results.concat([translate([0, 0, params.plateOffset], bodyTop(params, servos))]) : results
  results = params.showBottom ? results.concat([bodyBottom(params, servos)]) : results
  results = params.showMounts ? results.concat(assemblyMounts) : results

   // just for visual help
  results = params.showServos ? results.concat(servos) : results
  results = params.showPwmDriver ? results.concat(translate([0, 0, legMountsHeight], rotate([0, 0, 45], adafruitI2CPwmDriver()))) : results
  */
  return results
}

module.exports = {main, getParameterDefinitions}
