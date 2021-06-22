/*
  label.js
  ABCO-1 assembler label handler
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Util from './util.js';
import { isLabel, LineException } from './util.js';

/**
 * label preparation function
 * validates various aspects of each label,
 * and initializes them if they pass
 * @param {Array} contents
 */
export function prep (contents) {
  global.lineNo = 0;
  const labels = [];

  for (const line of contents) {
    global.lineNo++;
    if (!isLabel(line)) {
      continue;
    }

    const label = line.slice(0, -1);

    // if the label is the very last line in the file...
    if (contents[global.lineNo] === undefined) {
      throw new LineException(`label "${label}" must be followed by an instruction`);
    }

    // name validation
    if (label === 'abcout') {
      throw new LineException('"abcout" cannot be used as a label name');
    } else if (!label.match(/^[a-z_]([a-z0-9_]+)?$/)) {
      throw new LineException(`invalid label name "${label}`);
    } else if (labels.includes(label)) {
      throw new LineException(`label "${label}" already in use`);
    } else {
      labels.push(label);
    }

    if (global.macros[label] !== undefined) {
      Util.warn(`label "${label}" shares its name with a macro; this is not recommended`);
    }

    initialize(label);
  }
}

/**
 * initialize a label with a certain name
 * @param {String} name
 */
function initialize (name) {
  // this is a placeholder value, and gets updated later
  global.labels[name] = -1;
}
