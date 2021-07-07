/*
  label.js
  ABCO-1 assembler label handler
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Util from './util.js';
import { LineException, isLabel } from './util.js';

/**
 * label preparation function
 * validates various aspects of each label, and initializes them if they pass
 * @param {Array} contents
 */
export function prep (contents) {
  global.lineNo = 0;

  for (const line of contents) {
    global.lineNo++;
    if (!isLabel(line)) {
      continue;
    }

    if (line.startsWith('M')) {
      throw new LineException('labels starting with M are for internal use only');
    }

    // if the label is the very last line in the file...
    if (contents[global.lineNo] === undefined) {
      throw new LineException(`label "${line.slice(0, -1)}" must be followed by an instruction`);
    }

    validate(line);
    initialize(line);
  }
}

/**
 * validate a line consisting of a label declaration
 * @param {String} line
 * @param {Array} [siblings] other labels defined in the same scope as this one
 */
export function validate (line, siblings = Object.keys(global.labels)) {
  const label = line.slice(0, -1);

  // name validation
  if (label === 'abcout') {
    throw new LineException('"abcout" cannot be used as a label name');
  }
  if (!label.match(/^[a-z_]([a-z0-9_]+)?$/)) {
    throw new LineException(`invalid label name "${label}`);
  }

  if (siblings.includes(label)) {
    throw new LineException(`label "${label}" already in use`);
  }

  if (global.macros[label] !== undefined) {
    Util.warn(`label "${label}" shares its name with a macro; this is not recommended`);
  }
}

/**
 * initialize a label declaration
 * @param {String} label
 */
function initialize (label) {
  const name = label.slice(0, -1);

  // this is a placeholder value, and gets updated later
  global.labels[name] = -1;
}
