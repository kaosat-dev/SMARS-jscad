const {circle, square} = require('@jscad/csg/api').primitives2d
const {cylinder, sphere, cube} = require('@jscad/csg/api').primitives3d
const {color} = require('@jscad/csg/api').color
const {hull, chain_hull} = require('@jscad/csg/api').transformations
const {linear_extrude} = require('@jscad/csg/api').extrusions
const {rotate, translate, scale, mirror, contract, expand} = require('@jscad/csg/api').transformations
const {union, difference, intersection} = require('@jscad/csg/api').booleanOps

const {flatten} = require('./arrays')
const align = require('./utils/align')
const distribute = require('./utils/distribute')
const center = require('./utils/center')
const extractCenterPosition = require('./utils/extractCenterPosition')

const roundedRectangle = require('./lib/roundedRect')

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
    screen: {size: [18, 13, 2]}
  }
}

const battery_dimensions = {
  AA: {
    size: [50.5, 14.5], // length, diameter
    plus: [1, 5.5] // plus pole
  }
}

const battery = () => {
  const dims = battery_dimensions.AA
  // console.log('foo', dims.size)
  return union(
    cylinder({d: dims.size[1], h: dims.size[0]}),
    translate([0, 0, dims.size[0]], cylinder({d: dims.plus[1], h: dims.plus[0]}))
  )
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

const emitter = (params) => {
  const {D1_trippler_base, D1_oled_shield} = dimensions
  const joyPad = joypad_dimensions

  // trippler base
  const holesOffset = [-D1_trippler_base.board.size[0] / 2, -D1_trippler_base.board.size[1] / 2]
  const tripplerMountHoles = D1_trippler_base.mountHoles
    .map(holeData => translate(holeData.position, circle({r: holeData.diameter / 2, fn: 40, center: true})))
    .map(x => translate(holesOffset, x))

  const tripplerPcb = difference(
    square({size: D1_trippler_base.board.size, center: true}),
    union(tripplerMountHoles)
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
  const pcbClearance = 0.8 // how much distance should there be from the pcbs's 'sides'
  const sidesHeight = 18 // height between lowest point of top plate and highest of bottom plate
  const endRoundingSegments = 64

  const widthInner = Math.max(D1_trippler_base.board.size[1], joyPad.board.size[1])
  const width = widthInner + wallsThickness * 2 + pcbClearance * 2
  const length = D1_trippler_base.board.size[0] + joyPad.board.size[0]

  let alignedStuff = [tripplerPcb, joypadPcb]// align('top', tripplerPcb, joypadPcb)
  alignedStuff = distribute('leftToRight', alignedStuff)
  alignedStuff = center([1, 1], alignedStuff)

  const joyCenter = extractCenterPosition(alignedStuff[1])
  const tripplerCenter = extractCenterPosition(alignedStuff[0])

  const tripplerMountHolePosA = D1_trippler_base.mountHoles.map(data => data.position[0] + holesOffset[0] + tripplerCenter[0])
  const blockWidth = tripplerMountHolePosA[3] - tripplerMountHolePosA[2]
  const oledCenter = [tripplerMountHolePosA[2] + blockWidth / 2 + 0.5, -3]

  // side roundings
  const endRounding = circle({r: width / 2, center: true, fn: endRoundingSegments})
  const endRoundingOffsetL = 6

  // battery holder outline
  const batteryHolderShape = square({
    size: [
      battery_dimensions.AA.size[0] + wallsThickness + 7,
      battery_dimensions.AA.size[1] + wallsThickness + 3
    ],
    center: true,
    round: true
    // r: 4
  })
  // data for the assembly holes
  const boxMountHoleDia = 3
  const boxMountHoleSideOffset = 1
  const boxMountHoleBorderWOffset = width / 2 - boxMountHoleDia / 2 - boxMountHoleSideOffset
  const extremeSidesOffset = width / 4 + boxMountHoleDia / 2

  const boxMountHolesData = [
    { // not so sure about this one
      diameter: boxMountHoleDia,
      position: [length / 2 + extremeSidesOffset, 0]
    },
    /* {
      diameter: boxMountHoleDia,
      position: [length / 2 - 5, boxMountHoleBorderWOffset]
    }, */
    {
      diameter: boxMountHoleDia,
      position: [0, boxMountHoleBorderWOffset]
    },
    /* {
      diameter: boxMountHoleDia,
      position: [-length / 2 + 5, boxMountHoleBorderWOffset]
    }, */
    // other side
    { // not so sure about this one
      diameter: boxMountHoleDia,
      position: [-length / 2 - extremeSidesOffset, 0]
    },
    /* {
      diameter: boxMountHoleDia,
      position: [length / 2 - 5, -boxMountHoleBorderWOffset]
    }, */
    {
      diameter: boxMountHoleDia,
      position: [0, -boxMountHoleBorderWOffset]
    }
    /* {
      diameter: boxMountHoleDia,
      position: [-length / 2 + 5, -boxMountHoleBorderWOffset]
    } */
  ]

  // the generic base shape of the controller
  let boxShape = chain_hull(
      translate([-length / 2 + endRoundingOffsetL, 0], endRounding),
      translate([length / 2 - endRoundingOffsetL, 0], endRounding)
      // battery mount

      // translate([0, 0], square({size: [width, width-10], center: true})),
      // start
      // translate([20, -20], circle({r: 14.5 / 2})),
      // offsets
      // translate([20, -40], circle({r: 14.5 / 2})),
      // translate([-20, -40], circle({r: 14.5 / 2})),
      // translate([0, -10], batteryHolderShape),
      // end
      // translate([-20, -20], circle({r: 14.5 / 2})),

      // translate([-length / 2 + endRoundingOffsetL, 0], endRounding)
    )
  // boxShape = chain_hull(boxShape, translate([0, -30], batteryHolderShape))
  /* boxShape = difference(
    boxShape,
    translate([0, -15], batteryHolderShape)
  ) */

  // all the mount holes for the top plate
  const boxShapeTopHoles = union(
    boxMountHolesData.map(holeData => {
      return translate(holeData.position,
        circle({r: holeData.diameter / 2, center: true})
      )
    })
  )

  // top
  const boxShapeTop = difference([
    boxShape,
    boxShapeTopHoles,
    // correctly placed joypad hole
    translate(joyCenter, circle({r: joyPad.joystick.diameter / 2 + cutsClearance, center: true})),
    // correctly place oled screen hole
    translate(oledCenter, square({size: D1_oled_shield.screen.size.map(x => x + cutsClearance), center: true}))
  ])

  // bottom
  const boxShapeBottom = difference([
    boxShape,
    boxShapeTopHoles,
    translate([0, -15], batteryHolderShape)
  ])

  // sides
  let boxShapeSides = union(
    difference(
      boxShape,
      contract(wallsThickness, 1, boxShape)
    ),
    boxMountHolesData.map(holeData => {
      return translate(holeData.position,
        circle({r: (holeData.diameter + wallsThickness + cutsClearance) / 2, center: true})
      )
    })
  )

  // remove holes for mounts, they are pass-through
  boxShapeSides = difference(
    boxShapeSides,
    boxShapeTopHoles
  )
  // remove anything 'sticking'out
  const excess = difference(
    boxShapeSides,
    boxShape
  )
  boxShapeSides = difference(boxShapeSides, excess)

  let results = []
  if (params.showEmitTop) {
    const topRecessDepth = 2
    let cover = linear_extrude({height: platesThickness - topRecessDepth}, boxShapeTop)

    // recess for more electronics space
    let recessShape = difference(
      boxShape,
      contract(wallsThickness * 1, 1, boxShape)
    )
    /* cover = difference(
      cover,
      translate([0, 0, 0], linear_extrude({height: topRecessDepth}, recessShape))
    ) */

    // hole reinforcements just in case
    const holeReinforcements = boxMountHolesData.map(holeData => {
      return translate(holeData.position,
        circle({r: (holeData.diameter + wallsThickness + cutsClearance) / 2, center: true})
      )
    })
    recessShape = intersection(
      union(
        recessShape,
        holeReinforcements
      ),
      boxShape
    )
    recessShape = difference(recessShape, boxShapeTopHoles)
    cover = union(cover,
      translate([0, 0, -topRecessDepth], linear_extrude({height: topRecessDepth}, recessShape))

    )
    // cover = cover.union(holeReinforcements.map(x => linear_extrude({height: platesThickness}, x)))
    // cover
    results = results.concat(
      // 2d outline
      !params.readyToPrint ? boxShapeTop : [],
      // top
      translate([0, 0, sidesHeight], cover)
    )
  }
  if (params.showEmitBottom) {
    results = results.concat(
      // 2d outline
      !params.readyToPrint ? boxShapeBottom : [],
      // bottom
      translate(
        [0, 0, -platesThickness],
        linear_extrude({height: platesThickness}, boxShapeBottom)
      )
    )
  }

  if (params.showEmitSides) {
    const switchBodySize = [14, 5, 6]
    const swichHoldersSize = [22, 1, 6]
    const swichTriggerSize = [8, 4, 6]
    const switchPosition = [15, -width / 2 + 3.5, sidesHeight - swichHoldersSize[2]]

    let switchCut = union(
      cube({size: switchBodySize, center: [true, true, false]}),
      translate(
        [0, -switchBodySize[1] / 2 + swichHoldersSize[1] / 2, 0],
        cube({size: swichHoldersSize, center: [true, true, false]})
      ),
      translate(
        [0, -switchBodySize[1] / 2 - swichTriggerSize[1] / 2, 0],
        cube({size: swichTriggerSize, center: [true, true, false]})
      )
    )

    let sidesMain = color('gray', linear_extrude({height: sidesHeight}, boxShapeSides))
    const tripplerMountHolePos = D1_trippler_base.mountHoles.map(data => data.position[0] + holesOffset[0] + tripplerCenter[0])

    const ubsCutSize = [11, 6]
    const usbXoffset = tripplerMountHolePos[5] - tripplerMountHolePos[4]
    const usbPosition = [// 45
      tripplerMountHolePos[5] - usbXoffset * 0.5,
      width / 2,
      10 + ubsCutSize[1] / 2
    ]
    // .map(holeData
    const usbCutShape = roundedRectangle({size: ubsCutSize, radius: 1})
    const ubsCut = translate(
      usbPosition,
      rotate([90, 0, 0], linear_extrude({height: 10}, usbCutShape))
    )

    sidesMain = difference(
      sidesMain,
      ubsCut
    )

    sidesMain = difference(
      sidesMain,
      mirror([0, 1, 0], translate(switchPosition, switchCut))
    )
    // cutout for print tryout
    /* if (params.testPrintSlice) {
      sidesMain = intersection(
        sidesMain,
        translate(
          [60, 20, 0],
          cube({size: [60, 50, 30], center: [true, true, false]})
        )
      )
    } */
    if (params.testPrintSlice) {
      sidesMain = intersection(
        sidesMain,
        translate(
          [15, -20, 0],
          cube({size: [40, 50, 30], center: [true, true, false]})
        )
      )
    }

    results = results.concat(
      // 2d outline
      !params.readyToPrint ? boxShapeSides : [],
      // sides
      sidesMain
    )
  }

  // battery holder
  if (params.showEmitBattery) {
    results = results.concat(
      translate([-battery_dimensions.AA.size[0] / 2, -13, -8],
        rotate([0, 90, 0], battery())
      )
    )
  }

  if (params.showEmitPcbHolder) {
    const lowHeight = 2.5
    const lowCutHeight = 1
    const highHeight = 3.5
    const highCutHeight = 1// highHeight / 2 - 0.5
    const stubsReduction = 0.3
    const tripplerStubsHeight = 5
    const joyStubsHeight = 7

    const cableHoleHalfWidth = 2.5
    const cableHoles = [
      {size: [10, cableHoleHalfWidth * 2], position: [19, -width / 2 + cableHoleHalfWidth]},
      {size: [10, cableHoleHalfWidth * 2], position: [-10, -width / 2 + cableHoleHalfWidth]},
      // {size: [10, cableHoleHalfWidth * 2], position: [-39, -width / 2 + cableHoleHalfWidth]}
      {size: [10, cableHoleHalfWidth * 2], position: [19, width / 2 - cableHoleHalfWidth]},
      {size: [10, cableHoleHalfWidth * 2], position: [-10, width / 2 - cableHoleHalfWidth]}
    ]

    const sideBorders = difference(
      contract(wallsThickness + cutsClearance, 1, boxShape),
      contract(wallsThickness * 2.5, 1, boxShape)
    )

    const tripplerStubsShapes = D1_trippler_base.mountHoles
      .map(holeData => translate(holeData.position, circle({r: holeData.diameter / 2 - stubsReduction, fn: 40, center: true})))
      .map(x => translate(holesOffset, x))
    const tripplerStubs = linear_extrude({height: tripplerStubsHeight},
      translate(tripplerCenter, union(tripplerStubsShapes))
    )
    const tripplerPcbBaseShape = square({size: D1_trippler_base.board.size, center: true})
    const joyPcbBaseShape = square({size: joyPad.board.size, center: true})

    const offsetTripplerPcbBaseShape = translate(tripplerCenter, tripplerPcbBaseShape)
    const offsetJoyPcbBaseShape = translate(joyCenter, joyPcbBaseShape)

    const joyStubsShapes = joyPad.mountHoles
      .map(holeData => translate(holeData.position, circle({r: holeData.diameter / 2 - stubsReduction, fn: 40, center: true})))
      .map(x => translate(joyholesOffset, x))
    const joyStubs = linear_extrude({height: joyStubsHeight},
      translate(joyCenter, union(joyStubsShapes))
    )

    const tripllerShapesSide1 = tripplerMountHoles.slice(0, 6).map(x => translate(tripplerCenter, x))
    const tripllerShapesSide2 = tripplerMountHoles.slice(6).map(x => translate(tripplerCenter, x))
    const tripplerBase = linear_extrude({height: lowHeight},
          union(
            chain_hull(tripllerShapesSide1),
            chain_hull(tripllerShapesSide2)
          )
    )

    const joyBase = linear_extrude({height: highHeight},
      chain_hull(joyStubsShapes.map(x => translate(joyCenter, x)))
    )

    const boxMpuntHolesColumnCutouts = union(boxMountHolesData.map(holeData => {
      return translate(holeData.position,
        // twice the clearance since we need the space for the vertical through 'columns'
        circle({r: (holeData.diameter + wallsThickness + cutsClearance * 2) / 2, center: true})
      )
    }))

    let pcbHolder = union(
      linear_extrude({height: lowHeight},
        difference(sideBorders, boxMpuntHolesColumnCutouts)
      ),
      // outlines/border
      // linear_extrude({height: 6}, pcbHolderShape),
      // the actual 3d geometry
      joyStubs,
      joyBase,
      tripplerStubs,
      tripplerBase
    )
    // cutout pcb shapes
    pcbHolder = difference(
      pcbHolder,
      translate([0, 0, lowCutHeight], linear_extrude({height: 10}, offsetTripplerPcbBaseShape)),
      translate([0, 0, highCutHeight], linear_extrude({height: 10}, offsetJoyPcbBaseShape))
    )
    pcbHolder = union([pcbHolder, joyStubs, tripplerStubs])

    const holeCutouts = cableHoles
      .map(holeData => translate(holeData.position, roundedRectangle({size: holeData.size, radius: 1})))
      .map(hole => linear_extrude({height: 10}, hole))
      // cylinder({r: holeData.diameter / 2, h: 10, center: true})
    pcbHolder = difference(
      pcbHolder,
      ...holeCutouts
    )
    results = results.concat(pcbHolder)//, pcbBaseShapes)
  }
  return flatten(results)
}

module.exports = emitter
