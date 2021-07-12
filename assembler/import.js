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
import * as Util from './util.js';
import { LineException, isImport, isSeparated } from './util.js';

/**
 * import preparation function
 * makes sure each import statement in the file is technically valid
 * @param {Array} contents
 */
export function prep (contents) {
  global.lineNo = 0;
  const statements = [];

  for (const line of contents) {
    global.lineNo++;
    if (!isImport(line)) {
      continue;
    }

    if (line.startsWith('@import ')) {
      if (statements.includes(line)) {
        throw new LineException('an identical import statement already exists');
      }
      statements.push(line);

      const args = line.split(' ');

      // format check
      if (args[args.length - 1] === 'from') {
        throw new LineException('a file to import from must be given');
      }
      if (args[args.length - 2] !== 'from') {
        throw new LineException('malformed import statement');
      }

      // star check
      if (line.includes('*') && !line.match(/^@import \* from [^*]+$/)) {
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

  Util.pushStack(impFile);
  contents = Assembler.prep(contents); // reshape the contents
  Macro.prep(contents);
  Util.popStack();

  global.lineNo = impLine;

  let extMacros = (contents.join('\n').match(/%macro .*?%endmacro/gs) || [])
    .map(macro => macro.split('\n'));

  // if we're not importing all...
  if (impMacros[0] !== '*') {
    // make sure a relevant opening can be found for each macro we want to import
    for (const impMacro of impMacros) {
      if (extMacros.findIndex(ext => ext[0].startsWith(`%macro ${impMacro}`)) === -1) {
        throw new LineException(`macro "${impMacro}" not found`);
      }
    }
    // filter the macros to only those we want to import
    extMacros = extMacros.filter(ext =>
      impMacros.some(imp => ext[0].startsWith(`%macro ${imp} `))
    );
  }

  // try to create each macro that remains
  for (const extMacro of extMacros) {
    Util.pushStack(impFile);
    global.lineNo = contents.findIndex(line => line === extMacro[0]) + 1;
    Macro.create(extMacro);
    Util.popStack();
  }
}
