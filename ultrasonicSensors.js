//16 , 38
const variants = {
  us100: {
    board: {size: [44, 25, 2]},
    sensors: [
      {diameter: 16, height: 12, position: [-11.5, 0]},
      {diameter: 16, height: 12, position: [11.5, 0]}
    ],
    mountHoles: [
      {
        diameter: 3,
        xOffset: 40,
        yOffset: 20,
        positioning: 'center'
      }
    ]
  }
}

module.exports = variants
