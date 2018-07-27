const {rotate, translate, mirror} = require('@jscad/csg/api').transformations

// const servo = require('./servo')
// const bodyTop = require('./bodyTop')
// const bodyBottom = require('./bodyBottom')
const ultrasonicSensorHolder = require('./ultrasonicHolder')
const ultrasonicSensors = require('./ultrasonicSensors')
const emmiter = require('./emmiter')

const paramDefaults = {
  quality: 120,
  robotName: 'SMARS',
  ultrasonicSensor: {model: 'us100'}
}

function getParameterDefinitions () {
  return [
    { name: 'emmiter', type: 'group', caption: 'Emmiter' },
    { name: 'showEmmiter', type: 'checkbox', checked: true, caption: 'Show emmiter:' },

    { name: 'showEmitTop', type: 'checkbox', checked: false, caption: 'Show top:' },
    { name: 'showEmitBottom', type: 'checkbox', checked: true, caption: 'Show bottom:' },
    { name: 'showEmitSides', type: 'checkbox', checked: false, caption: 'Show sides' },
    { name: 'showEmitBattery', type: 'checkbox', checked: true, caption: 'Show battery holder:' },

    { name: 'showEmitPcbHolder', type: 'checkbox', checked: true, caption: 'Show pcb holder:' },

    { name: 'readyToPrint', type: 'checkbox', checked: false, caption: 'Ready for 3d print' },

    { name: 'ultrasonic', type: 'group', caption: 'Ultrasonic sensor' },
    { name: 'showUltrasonic', type: 'checkbox', checked: false, caption: 'Show ultrasonic sensor holder:' },
    { name: 'usConnectorCutout', type: 'checkbox', checked: true, caption: 'cutout for connectors' },
    { name: 'usPilon', type: 'checkbox', checked: true, caption: 'add "pilon" to hold pcb' },
    {
      name: 'usModel',
      type: 'choice',
      values: Object.keys(ultrasonicSensors), // these are the values that will be supplied to your script
      captions: Object.keys(ultrasonicSensors),
      // if omitted, the items in the 'values' array are used
      caption: 'Sensor model:', // optional, displayed left of the input field
      initial: 'us100' // optional, default selected value
      // if omitted, the first item is selected by default
    },
    { name: 'usTestSlice', type: 'checkbox', checked: true, caption: 'create a slice to test print' },
  ]
}

function main (params) {
  params = Object.assign({}, paramDefaults, params)
  params = Object.assign({}, params, {ultrasonicSensor: ultrasonicSensors[params.usModel]})
  console.log('params foo', params)
  let results = []
  results = params.showUltrasonic ? results.concat(ultrasonicSensorHolder(params)) : results
  results = params.showEmmiter ? results.concat(emmiter(params)) : results
  return results
}

module.exports = {main, getParameterDefinitions}
