/*
  import.js
  ABCO-1 assembler import handler
  copyright (c) 2021 sporeball
  MIT license
*/

import fs from 'fs';
import eol from 'eol';

import * as Assembler from './index.js';
import * as Macro from './macro.js';
import { LineException, isSeparated } from './util.js';

/**
 * import preparation function
 * makes sure each import statement in the file is technically valid
 * @param {Array} contents
 */
export function prep (contents) {
  global.lineNo = 0;
  const statements = [];

  for (let line of contents) {
    global.lineNo++;
    if (!line.startsWith('@')) {
      continue;
    }

    if (line.startsWith('@import ')) {
      if (statements.includes(line)) {
        throw new LineException('an identical import statement already exists');
      }

      let args = line.split(' ');

      // "from" and file check
      if (args[args.length - 1] === 'from') {
        throw new LineException('a file to import from must be given');
      }
      if (args[args.length - 2] !== 'from') {
        throw new LineException('malformed import statement');
      }

      // comma separation check
      if (!isSeparated(args.slice(1, args.length - 2))) {
        throw new LineException('macros to import must be comma-separated');
      }
      // last sanity check
      if (args.slice(args.length - 2).join(' ').includes(',')) {
        throw new LineException('malformed import statement');
      }

      statements.push(line);
    } else {
      throw new LineException('invalid use of @');
    }
  }
}

/**
 * add an import statement's macros to the code
 * @param {String} imp import statement
 */
export function add (imp) {
  let contents;
  const impLine = global.lineNo;

  // imp = original statement; ext = other file

  // initial manipulation
  imp = imp.replace(/,/g, '')
    .split(' ')
    .slice(1);

  imp.unshift(imp[imp.length - 1]); // move filename to the start
  imp.splice(imp.length - 2, 2); // remove unnecessary pieces from the end

  let [impFile, ...impMacros] = imp;
  impFile += '.abcout';

  try {
    contents = eol.lf(fs.readFileSync(`${impFile}`, { encoding: 'utf-8' }));
  } catch (e) {
    throw new LineException(`file "${impFile}" not found`);
  }

  global.callStack.push([global.file, global.lineNo]);
  contents = Assembler.prep(contents); // reshape the contents
  Macro.prep(contents); // catch nesting
  global.callStack.pop();

  const extMacros = (contents.join('\n').match(/%macro .*?%endmacro/gs) || [])
    .map(macro => macro.split('\n'));

    global.lineNo = impLine;

  // for each macro we want to import...
  for (const impMacro of impMacros) {
    // make sure a relevant opening can be found
    const extIdx = extMacros.findIndex(ext => ext[0].startsWith(`%macro ${impMacro} `));
    if (extIdx === -1) {
      throw new LineException(`macro "${impMacro}" not found`);
    }

    // try to create the macro
    global.callStack.push([global.file, global.lineNo]);
    global.lineNo = extIdx;
    Macro.create(extMacros[extIdx]);
    global.callStack.pop();
  }
}
