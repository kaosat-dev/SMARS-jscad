// 16 , 38
const variants = {
  us100: {
    board: {size: [44, 20, 2]},
    sensors: [
      {diameter: 16, height: 12, position: [-11.25, 0]},
      {diameter: 16, height: 12, position: [11.25, 0]}
    ],
    mountHoles: [
      {
        diameter: 3,
        xOffset: 40,
        yOffset: 20,
        positioning: 'center'
      }
    ],
    connectors: [
      {size: [14, 3]}
    ]
  },
  srf02: {
    board: {size: [24, 20, 2]},
    sensors: [
      {diameter: 16, height: 17, position: [0, 0]}
    ],
    mountHoles: [],
    connectors: [
      {size: [14, 3]}
    ]
  }

}

module.exports = variants
