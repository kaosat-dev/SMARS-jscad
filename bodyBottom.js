const {circle} = require('jscad-tree-experiment').api.primitives2d
const {cylinder} = require('jscad-tree-experiment').api.primitives3d
const {color} = require('jscad-tree-experiment').api.color
const {hull} = require('jscad-tree-experiment').api.transformations
const {linear_extrude} = require('jscad-tree-experiment').api.extrusions
const {rotate, translate, mirror} = require('jscad-tree-experiment').api.transformations
const {union, difference} = require('jscad-tree-experiment').api.booleanOps

const bolt = require('./bolts')

module.exports = function bodyTop (params, servos) {

}