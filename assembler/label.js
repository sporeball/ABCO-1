/*
  label.js
  ABCO-1 assembler label handler
  copyright (c) 2021 sporeball
  MIT license
*/

const {Exception, LineException, ...Util} = require("./util.js");

/**
 * initialize a label given a line containing one
 * @param {String} label
 */
function initialize(label) {
  label = label.slice(0, -1);

  validate(label);

  // initialize with a placeholder value
  // this gets updated later
  global.labels[label] = -1;
}

/**
 * validate the given label name 
 * @param {String} label
 */
function validate(label) {
  if (global.labels[label] !== undefined) { throw new LineException(`label "${label}" already in use`); }

  if (label == "abcout") { throw new LineException("\"abcout\" cannot be used as a label name"); }
  if (!label.match(/^[a-z_]([a-z0-9_]+)?$/)) { throw new LineException("invalid label name"); }

  if (macros[label] !== undefined) { Util.warn(`label "${label}" shares its name with a macro; this is not recommended`); }
}

module.exports = { initialize };
