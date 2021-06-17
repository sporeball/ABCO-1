/*
  index.js
  ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// dependencies
import * as Label from './label.js';
import * as Macro from './macro.js';
import * as Util from './util.js';
import { LineException } from './util.js';

import fs from 'fs';

global.lineNo = 1;
global.labels = {};
global.macros = {};

let contents; // file contents

export default function assemble (input, args) {
  contents = input;
  let bytes = '';
  // ROM address of the instruction we are looking at
  // used in final pass
  let ip = 0;

  if (contents.slice(-1) === '\n') {
    contents = contents.slice(0, -1);
  }

  // initial processing
  contents = contents.replace(/;.*$/gm, '')
    .replace(/\$/gm, '0x')
    .split('\n')
    .map(x => x.trim())
    .map(x => Util.normalize(x)) // collapse whitespace within
    .map(x => x.startsWith('abcout') && !x.endsWith(':') ? x.slice(7) : x); // remove "abcout"

  // cast hex literals to numbers
  contents.forEach(x => {
    x = Util.parseHex(x);
    global.lineNo++;
  });

  // create all macros
  for (const macro of contents.join('\n').match(/%macro .*?%endmacro/gs) || []) {
    const definition = macro.split('\n')[0]; // the definition line
    global.lineNo = contents.indexOf(definition) + 1;

    Macro.create(macro);
  }

  // array of array of empty strings
  // formed by taking the code's macro definitions, and replacing the lines of each
  const blanks = (contents.join('\n').match(/%macro .*?%endmacro/gs) || [])
    .map(x => x.split('\n').map(y => ''));

  // replace any line that's part of a macro definition with the empty string
  contents = contents.join('\n')
    .split(/%macro.*?%endmacro/gs) // split on macro
    .map((x, i) => [x, blanks[i]]) // interleave with blanks
    .flat(2)
    .slice(0, -1) // remove last element (undefined)
    .map(x => x.match(/^(\n)+$/) ? '' : x) // normalize any string consisting only of line endings
    .map(x => x.split('\n')) // split on the line endings that remain
    .flat(Infinity); // and flatten

  // initialize all labels
  for (const label of contents.filter(x => x.match(/^.+:$/))) {
    global.lineNo = contents.indexOf(label) + 1;
    // stupid and confusing hack ahead
    if (contents[global.lineNo].match(/^.+:$/)) {
      global.lineNo++;
      throw new LineException('two labels cannot reference the same address');
    }

    Label.initialize(label);
  }

  global.lineNo = 0;

  // expand all macros
  contents = contents.flatMap(x => {
    global.lineNo++;
    if (Util.isMacro(x)) {
      return Macro.expand(x, true);
    } else {
      return x;
    }
  });

  // set all labels
  const filtered = contents.filter(x => x !== '');
  for (let label of filtered.filter(x => x.match(/^.+:$/))) {
    const index = filtered.indexOf(label);
    label = label.slice(0, -1); // remove colon
    global.labels[label] = index * 6;
    filtered.splice(index, 1);
  }

  // replace any label declaration with the empty string
  contents = contents.map(x => x.match(/^.+:$/) ? '' : x);

  global.lineNo = 0;

  // assemble the ROM
  for (const line of contents) {
    global.lineNo++;

    if (line === '') continue;

    // ROM size is 32K, and we have to guarantee that space is left at the end of a theoretical filled ROM for our halt condition
    // this leads to a hard limit of 5,460 instructions
    if (bytes.length === 32760) {
      throw new LineException('too many instructions');
    }

    const args = Util.argify(line);
    if (args.length !== 2 && args.length !== 3) { throw new LineException('wrong number of arguments'); }
    const C = args[2];

    console.log(C);

    if (C === undefined) {
      args[2] = ip + 6;
    } else if (C.match(/^[a-z_]([a-z0-9_]+)?$/)) {
      if (global.labels[C] === undefined) { throw new LineException('label not found'); }
      args[2] = global.labels[C];
    }

    if (args[2] % 6 !== 0) { throw new LineException('invalid value for argument C'); }

    for (const arg of args) {
      const n = Number(arg);
      if (isNaN(n)) { throw new LineException('non-numeric argument given'); }
      if (n > 32767) {
        throw new LineException('argument too big');
      } else if (n > 255) {
        bytes += String.fromCharCode(n >> 8); // upper 8 bits of n
        bytes += String.fromCharCode(n & 255); // lower 8 bits of n
      } else if (n >= 0) {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(n);
      } else {
        throw new LineException('argument cannot be negative');
      }
    }

    ip += 6;
    console.log(ip);
  }

  // add halt condition
  bytes += String.fromCharCode(0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF);
  // pad with null bytes until 32K
  bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  fs.writeFile(args.out, bytes, 'binary', () => {});
  Util.success('finished!');
}
