const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {color} = require('@jscad/csg/api').color

const ultrasonicSensorHolder = require('./ultrasonicHolder')
const ultrasonicSensors = require('./ultrasonicSensors')
const emitter = require('./emitter')
const chassis = require('./chassis/base')
const drive = require('./drive')

// these now work in the browser too !
const fs = require('fs')
const bar = fs.readFileSync('SMARS-jscad/foo.txt')
console.log('read from file', bar)
const paramDefaults = {
  quality: 120,
  robotName: 'SMARS',
  ultrasonicSensor: {model: 'us100'}
}

const availables = {
  chassis: {
    'smars-standard': 42
  }
}

const drives = {
  wheels: {
    amount: 4
  },
  trackedWheel: {},
  foo: {}
}

// base on motors TYPE
// => change motor/drive mounts

// combine motor type, motor counts/ positions/oritentations

function getParameterDefinitions () {
  return [
    {
      name: 'chassisDims',
      type: 'choice',
      caption: 'chassis type',
      values: Object.keys(availables.chassis), // these are the values that will be supplied to your script
      captions: Object.keys(availables.chassis),
      initial: 'smars-standard'
    },
    {
      name: 'motorisation',
      type: 'choice',
      caption: 'motors type',
      values: ['miniGearMotor', 'servoContinuous'],
      captions: ['mini gear motor', 'servo (continuous)'],
      initial: 'miniGearMotor'
    },
    { name: 'testPrintSlice', type: 'checkbox', checked: false, caption: 'Test print slice' },
    // emitter
    { name: 'emitter', type: 'group', caption: 'Emitter' },
    { name: 'showEmitter', type: 'checkbox', checked: false, caption: 'Show emitter:' },

    { name: 'showEmitTop', type: 'checkbox', checked: false, caption: 'Show top:' },
    { name: 'showEmitBottom', type: 'checkbox', checked: true, caption: 'Show bottom:' },
    { name: 'showEmitSides', type: 'checkbox', checked: false, caption: 'Show sides' },
    { name: 'showEmitBattery', type: 'checkbox', checked: true, caption: 'Show battery holder:' },

    { name: 'showEmitPcbHolder', type: 'checkbox', checked: true, caption: 'Show pcb holder:' },

    { name: 'readyToPrint', type: 'checkbox', checked: false, caption: 'Ready for 3d print' },

    // chassis
    { name: 'chassis', type: 'group', caption: 'Chassis' },
    { name: 'showChassis', type: 'checkbox', checked: true, caption: 'Show chassis:' },
    { name: 'chShowMotorBlock', type: 'checkbox', checked: true, caption: 'Show motor block:' },
    { name: 'chShowCoverBlock', type: 'checkbox', checked: true, caption: 'Show cover block:' },
    { name: 'chShowMotors', type: 'checkbox', checked: true, caption: 'Show motors:' },
    { name: 'chShowBatteries', type: 'checkbox', checked: true, caption: 'Show batteries:' },
    { name: 'chSeeThrough', type: 'checkbox', checked: true, caption: 'See through:' },

    // wheels/drive
    { name: 'drive', type: 'group', caption: 'Drive' },
    { name: 'showDrive', type: 'checkbox', checked: false, caption: 'Show drive:' },
    {
      name: 'mType',
      type: 'choice',
      values: Object.keys(drives), // these are the values that will be supplied to your script
      captions: Object.keys(drives),
      caption: 'drive type:', // optional, displayed left of the input field
      initial: 'trackedWheel' // optional, default selected value
      // if omitted, the first item is selected by default
    },

    // ultrasonic sensor
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
    { name: 'usTestSlice', type: 'checkbox', checked: true, caption: 'create a slice to test print' }
  ]
}

function main (params) {
  params = Object.assign({}, paramDefaults, params)
  params = Object.assign({}, params, {
    ultrasonicSensor: ultrasonicSensors[params.usModel],
    drives
  })
  let results = []
  results = params.showUltrasonic ? results.concat(
    translate([65, 0, 40], rotate([90, 0, -90], color('orange', ultrasonicSensorHolder(params))))

  ) : results
  results = params.showEmitter ? results.concat(emitter(params)) : results
  results = params.showChassis ? results.concat(chassis(params)) : results
  results = params.showDrive ? results.concat(drive(params)) : results
  return results
}

module.exports = {main, getParameterDefinitions}
