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
import * as Import from './import.js';
import * as Util from './util.js';
import { Exception, isBlank, isImport, isLabel, isMacro } from './util.js';

let contents; // file contents
let bytes = ''; // final byte stream

/**
 * main function
 * @param {String} input
 * @returns {String}
 */
export default function assemble (input) {
  contents = input;

  Util.resetGlobalState();
  global.callStack.namespaces.unshift(global.file);

  // initial processing
  contents = prep(contents);

  // import preparation step
  Import.prep(contents);

  // add all imports
  for (const imp of contents.filter(line => isImport(line))) {
    const impIdx = contents.indexOf(imp) + 1;
    global.lineNo = impIdx;

    Import.add(imp);
    contents[impIdx - 1] = ''; // blank the statement
  }

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
      const name = line.split(' ')[0];
      return Macro.expand(line, true, global.macros[name].labels);
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
    contents.splice(index, 1); // remove the declaration
  }

  // assemble the ROM
  for (const line of contents) {
    const args = Util.argify(line);
    // replace C if needed
    if (args[2] === undefined) {
      args[2] = global.ip + 6;
    }
    if (isNaN(Number(args[2]))) {
      args[2] = global.labels[args[2]];
    }

    for (const arg of args) {
      if (arg > 255) {
        bytes += String.fromCharCode(arg >> 8); // upper 8 bits
        bytes += String.fromCharCode(arg & 255); // lower 8 bits
      } else {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(arg);
      }
    }

    global.ip += 6;
  }

  // ROM size is 32K, and we have to guarantee that space is left at the end of a theoretical filled ROM for the halt condition
  // this leads to a hard limit of 5,460 instructions (32,760 bytes)
  if (bytes.length > 32760) {
    throw new Exception(`too many instructions (wrote ${(bytes.length / 6)})`);
  }

  // add halt condition
  bytes += String.fromCharCode(0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF);

  // done
  return bytes;
}

/**
 * root preparation function
 * reshapes the contents of a file
 * this is used to prepare the main program, but also the contents of any imported files
 * @param {String} contents
 * @returns {Array}
 */
export function prep (contents) {
  global.lineNo = 1;

  if (contents.endsWith('\n')) {
    contents = contents.slice(0, -1);
  }

  // replacements and slices
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

  return contents;
}
