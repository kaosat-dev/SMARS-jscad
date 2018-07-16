const {circle, square} = require('@jscad/csg/api').primitives2d
const {cylinder, sphere, cube} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, mirror} = require('@jscad/csg/api').transformations
const {union, difference} = require('@jscad/csg/api').booleanOps

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

// todo , add align on etc
const align = (position, ...shapes) => {
  const bounds = shapes.map(shape => shape.getBounds())
  // console.log('firstBounds', JSON.stringify(bounds))
  const offsets = bounds.map(bound => {
    /* const offset = [
      bounds[0][0].x - bound[0].x,
      bounds[0][0].y - bound[0].y
    ]
    console.log('offset', JSON.stringify(bounds[0][0]),'fbla', JSON.stringify(bound[0])) */
    let offset
    if (position === 'top') {
      offset = bounds[0][0].y - bound[0].y
    } else if (position === 'bottom') {
      offset = bound[0].y - bounds[0][0].y
    }
    return offset
  })

  /* if(position === 'top'){

  } */
  const offsetShapes = shapes.map((shape, index) => {
    return translate([0, offsets[index]], shape)
  })
  console.log('offsets', JSON.stringify(offsets))
  return offsetShapes
}
const distribute = (spreadType = 'leftToRight', ...shapes) => {
  // TODO flatten/to array
  shapes = shapes[0]
  const offsetShapes = shapes.slice(1).map((shape, index) => {
    let offset
    const prevShape = shapes[index]

    if (spreadType === 'leftToRight') {
      const bounds = shape.getBounds()
      const prevBounds = prevShape.getBounds()
      offset = bounds[0].x - prevBounds[1].x
    }
    return translate([offset, 0], shape)
  })

  return [shapes[0]].concat(offsetShapes)
}

const center = (axes = [1, 1, 1], ...shapes) => {
  let minX = +Infinity
  let maxX = -Infinity
  // TODO flatten/to array
  shapes = shapes[0]

  shapes.forEach(shape => {
    const bound = shape.getBounds()

    if (bound[0].x < minX) {
      minX = bound[0].x
    }
    if (bound[1].x > maxX) {
      maxX = bound[1].x
    }
  })

  let offset = [(maxX - minX) * 0.5, 0]
  offset[0] = offset[0] + shapes[0].getBounds()[0].x
  return shapes.map(shape => translate(offset, shape))
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

  // box itself
  const wallsThickness = 2
  const widthInner = Math.max(D1_trippler_base.board.size[1], joyPad.board.size[1])
  const width = widthInner + wallsThickness * 2
  const length = D1_trippler_base.board.size[0] + joyPad.board.size[0]

  const tripplerOffsetL = D1_trippler_base.board.size[0] - length / 2
  const joypadOffsetL = (D1_trippler_base.board.size[0] / 2 + joyPad.board.size[0] / 2) - tripplerOffsetL

  let alignedStuff = align('top', tripplerPcb, joypadPcb)
  alignedStuff = distribute('leftToRight', alignedStuff)
  alignedStuff = center([1, 1], alignedStuff)

  // side roundings
  const endRounding = circle({r: width / 2, center: true})
  const endRoundingOffsetL = 6

  const boxShape = difference(
    hull(
    translate([-length / 2 + endRoundingOffsetL, 0], endRounding),
    translate([length / 2 - endRoundingOffsetL, 0], endRounding)
  ),
  union(mountHoles)
)

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
