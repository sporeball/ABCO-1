/*
  index.js
  ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// dependencies
import * as Instruction from './instruction.js';
import * as Label from './label.js';
import * as Macro from './macro.js';
import * as Util from './util.js';
import { Exception, isBlank, isLabel, isMacro } from './util.js';

import fs from 'fs';

global.lineNo = 1;
global.ip = 0;
global.labels = {};
global.macros = {};

let contents; // file contents

export default function assemble (input, args) {
  contents = input;
  let bytes = '';

  if (contents.endsWith('\n')) {
    contents = contents.slice(0, -1);
  }

  // initial processing
  contents = contents.replace(/;.*$/gm, '')
    .replace(/\$/gm, '0x')
    .split('\n')
    .map(line => line.trim())
    .map(line => Util.normalize(line)) // collapse whitespace within
    .map(line => line.startsWith('abcout ') ? line.slice(7) : line); // remove "abcout"

  // cast hex literals to numbers
  contents.forEach(line => {
    line = Util.parseHex(line);
    global.lineNo++;
  });

  // macro preparation step
  Macro.prep(contents);

  // create all macros
  for (let macro of contents.join('\n').match(/%macro .*?%endmacro/gs) || []) {
    macro = macro.split('\n');
    const opening = macro[0];
    const openingIdx = contents.indexOf(opening) + 1;
    global.lineNo = openingIdx;

    // create the macro
    Macro.create(macro);
    // blank out the lines it consists of
    for (let i = openingIdx; i <= global.lineNo + 1; i++) {
      contents[i - 1] = '';
    }
  }

  // label preparation step
  Label.prep(contents);

  // instruction preparation step
  Instruction.prep(contents);

  global.lineNo = 0;

  // expand all macros
  contents = contents.flatMap(line => {
    global.lineNo++;
    if (isMacro(line)) {
      return Macro.expand(line, true);
    } else {
      return line;
    }
  });

  contents = contents.filter(line => !isBlank(line));

  // set all labels
  for (let label of contents.filter(line => isLabel(line))) {
    const index = contents.indexOf(label);
    label = label.slice(0, -1); // remove colon
    global.labels[label] = index * 6;
    contents.splice(index, 1);
  }

  global.lineNo = 0;

  // assemble the ROM
  for (const line of contents) {
    global.lineNo++;

    // ROM size is 32K, and we have to guarantee that space is left at the end of a theoretical filled ROM for our halt condition
    // this leads to a hard limit of 5,460 instructions
    if (bytes.length === 32760) {
      throw new Exception('too many instructions');
    }

    const args = Util.argify(line).map(Number);
    // replace C if needed
    if (args[2] === undefined) {
      args[2] = global.ip + 6;
    }
    if (isNaN(args[2])) {
      args[2] = global.labels[args[2]];
    }

    for (const arg of args) {
      if (arg > 255) {
        bytes += String.fromCharCode(arg >> 8); // upper 8 bits of n
        bytes += String.fromCharCode(arg & 255); // lower 8 bits of n
      } else {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(arg);
      }
    }

    global.ip += 6;
  }

  // add halt condition
  bytes += String.fromCharCode(0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF);
  // pad with null bytes until 32K
  bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  fs.writeFile(args.out, bytes, 'binary', () => {});
  Util.success('finished!');
}
