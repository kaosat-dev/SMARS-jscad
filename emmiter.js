const {circle, square} = require('@jscad/csg/api').primitives2d
const {cylinder, sphere, cube} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {union, difference} = require('@jscad/csg/api').booleanOps

const {flatten} = require('./arrays')
const align = require('./utils/align')
const distribute = require('./utils/distribute')
const center = require('./utils/center')

const dimensions = {
  D1_mini: {
    board: {size: [34.2, 25.6, 1]}
  },
  D1_trippler_base: {
    board: {size: [79, 34.3, 1]},
    mountHoles: [
      {
        diameter: 3.1,
        position: [3, 3]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7, 3]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1, 3]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1 + 19.7, 3]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1 + 19.7 + 7.1, 3]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1 + 19.7 + 7.1 + 19.7, 3]
      },
      // second row
      {
        diameter: 3.1,
        position: [3, 3 + 28]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7, 3 + 28]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1, 3 + 28]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1 + 19.7, 3 + 28]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1 + 19.7 + 7.1, 3 + 28]
      },
      {
        diameter: 3.1,
        position: [3 + 19.7 + 7.1 + 19.7 + 7.1 + 19.7, 3 + 28]
      }

    ]
  },
  D1_oled_shield: {
    board: {size: [33, 25.6, 1]},
    screen: {size: [21, 18, 2]}
  }
}

const battery_dimensions = {
  AA: {
    size: [50.5, 14.5], // length, length
    plus: [1, 5.5] // plus pole
  }
}

const batteryHolderCut = (params) => {
  const size = battery_dimensions.AA
  return union(
    cube({size: [...size, size[1]]})
  )
}

const joypad_dimensions = {
  board: {
    size: [38.1, 38.1, 1]
  },
  joystick: {
    diameter: 26
  },
  mountHoles: [
    {
      diameter: 3,
      position: [3.5, 3.5]
    },
    {
      diameter: 3,
      position: [3.5 + 31, 3.5]
    },
    {
      diameter: 3,
      position: [3.5 + 31, 3.5 + 31]
    },
    {
      diameter: 3,
      position: [3.5, 3.5 + 31]
    }
  ]
}

const extractCenterPosition = (shape) => {
  const bounds = shape.getBounds()
  const position = [bounds[1].x + bounds[0].x, bounds[1].y + bounds[0].y].map(x => x * 0.5)
  console.log('bounds', bounds, position)
  return position
}

module.exports = function emitter (params) {
  const {D1_trippler_base, D1_oled_shield} = dimensions
  const joyPad = joypad_dimensions

  // trippler base
  const holesOffset = [-D1_trippler_base.board.size[0] / 2, -D1_trippler_base.board.size[1] / 2]
  const mountHoles = D1_trippler_base.mountHoles
    .map(holeData => translate(holeData.position, circle({r: holeData.diameter / 2, fn: 40, center: true})))
    .map(x => translate(holesOffset, x))

  const tripplerPcb = difference(
    square({size: D1_trippler_base.board.size, center: true}),
    union(mountHoles)
  )

  // oled
  const oledCutout = difference(
    square({size: D1_oled_shield.board.size, center: true}),
    square({size: D1_oled_shield.screen.size, center: true})
  )

  // joypad
  const joypadCutOut = difference(
    square({size: joyPad.board.size, center: true}),
    circle({r: joyPad.joystick.diameter / 2, center: true})
  )

  const joyholesOffset = [-joyPad.board.size[0] / 2, -joyPad.board.size[1] / 2]
  const joymountHoles = joyPad.mountHoles
    .map(holeData => translate(holeData.position, circle({r: holeData.diameter / 2, fn: 40, center: true})))
    .map(x => translate(joyholesOffset, x))
  const joypadPcb = difference(
    square({size: joyPad.board.size, center: true}),
    union(
      joymountHoles
    )
  )

  // battery holder

  // box itself
  const wallsThickness = 3 // thickess of the 'sides'
  const platesThickness = 3 // thickness of the 'plates'
  const cutsClearance = 0.1 // how much bigger to make holes for cuts
  const widthInner = Math.max(D1_trippler_base.board.size[1], joyPad.board.size[1])
  const width = widthInner + wallsThickness * 2
  const length = D1_trippler_base.board.size[0] + joyPad.board.size[0]

  let alignedStuff = align('top', tripplerPcb, joypadPcb)
  alignedStuff = distribute('leftToRight', alignedStuff)
  alignedStuff = center([1, 1], alignedStuff)

  const joyCenter = extractCenterPosition(alignedStuff[1])
  const oledCenter = [19, -5]

  // side roundings
  const endRounding = circle({r: width / 2, center: true})
  const endRoundingOffsetL = 6

  // data for the assembly holes
  const boxMountHoleDia = 3
  const boxMountHoleSideOffset = 1
  const boxMountHoleBorderWOffset = width / 2 - boxMountHoleDia / 2 - boxMountHoleSideOffset
  const boxMountHolesData = [
    { // not so sure about this one
      diameter: boxMountHoleDia,
      position: [length / 2 + 5, 0]
    },
    {
      diameter: boxMountHoleDia,
      position: [length / 2 - 10, boxMountHoleBorderWOffset]
    },
    {
      diameter: boxMountHoleDia,
      position: [0, boxMountHoleBorderWOffset]
    },
    {
      diameter: boxMountHoleDia,
      position: [-length / 2 + 10, boxMountHoleBorderWOffset]
    },
    // other side
    { // not so sure about this one
      diameter: boxMountHoleDia,
      position: [-length / 2 - 5, 0]
    },
    {
      diameter: boxMountHoleDia,
      position: [length / 2 - 10, -boxMountHoleBorderWOffset]
    },
    {
      diameter: boxMountHoleDia,
      position: [0, -boxMountHoleBorderWOffset]
    },
    {
      diameter: boxMountHoleDia,
      position: [-length / 2 + 10, -boxMountHoleBorderWOffset]
    }
  ]

  // the generic shape of the controller
  const boxShape = difference(
    hull(
    translate([-length / 2 + endRoundingOffsetL, 0], endRounding),
    translate([length / 2 - endRoundingOffsetL, 0], endRounding)
  )
  // union(mountHoles)
)

  // all the mount holes for the top plate
  const boxShapeTopHoles = union(
    boxMountHolesData.map(holeData => {
      return translate(holeData.position,
        circle({r: holeData.diameter / 2, center: true})
      )
    })
  )

  const boxShapeTop = difference([
    boxShape,
    boxShapeTopHoles,
    // correctly placed joypad hole
    translate(joyCenter, circle({r: joyPad.joystick.diameter / 2 + cutsClearance, center: true})),
    // correctly place oled screen hole
    translate(oledCenter, square({size: D1_oled_shield.screen.size.map(x => x += cutsClearance), center: true}))
  ])

  // standoffs to hold main pcb in place
  const standOffsBase = D1_trippler_base.mountHoles
    .map(holeData => translate(holeData.position, circle({r: holeData.diameter / 2 - 0.1, fn: 40, center: true})))
    .map(x => translate(holesOffset, x))
  const standOffs = linear_extrude({height: 7},
    union(standOffsBase)
  )

  /* const endRoundings = sphere({r: width / 2 + wallsThickness})
  const endRoundingsLOffset = width + wallsThickness
  const foo = union(
    boxMain,
    translate([-length + endRoundingsLOffset, 0, width / 4], endRoundings),
    translate([length - endRoundingsLOffset, 0, width / 4], endRoundings)
  ) */
  return [
    boxShape,
    boxShapeTop,
    // top
    linear_extrude({height: platesThickness}, boxShapeTop),
    // sides ??
    translate(
      [0, 0, -15],
      color('gray', linear_extrude({height: 15}, boxShape))
    ),
    // bottom ??
    translate(
      [0, 0, -18],
      linear_extrude({height: platesThickness}, boxShape)
    ),
   // oledCutout,
    // joypadCutOut,
    // translate([+tripplerOffsetL, 0], tripplerPcb),
    // translate([-joypadOffsetL, 0], joypadPcb)
    alignedStuff[0],
    alignedStuff[1]
    // boxBaseShape,
    // standOffs
  ]
}
