const batteries = {
  AA: {
    size: [50.5, 14.5], // length, diameter
    plus: [1, 5.5] // plus pole
  }
}

const joyPad = {
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

const electronics = {
  joyPad,
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
  },
  pi_zero_w: {
    board: {size: [65, 30, 2]}
  }
}

const chassis = {
  size: [70, 58, 33],
  wallsThickness: [2, 3, 3], //  front back, left right, bottom
  axles: [
    {
      diameter: 4,
      position: [-27, 0, 7]
    },
    {
      diameter: 4,
      position: [27, 0, 7]
    }
  ],
  frontCut: {
    sizeTop: [42, 18],
    positionTop: [0, 13]
  },
  backCut: {
    sizeTop: [42, 18],
    positionTop: [0, 13]
  },
  pcbCut: {
    thickness: 1,
    depth: 0.5, // depth of cut
    position: [0, 0, 2]// from top
  },
  sideCuts: [
  ],
  motors: [
    {size: [20, 12]},
    {size: [20, 12]}
  ],
  motorMounts: [
    {
      notch: {size: [19, 2, 2]},
      blocker: {size: [4, 2, 2], position: [20, 0, 0]}
    }
  ]
}

const dimentions = {
  batteries,
  electronics,
  chassis
}

module.exports = {dimentions}
