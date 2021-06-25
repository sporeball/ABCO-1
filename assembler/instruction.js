/*
  instruction.js
  ABCO-1 assembler instruction handler
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Util from './util.js';
import { LineException, isAbcout, isBlank, isLabel, isMacroParameter } from './util.js';

/**
 * instruction preparation function
 * validates every instruction left in the file after the macro and label steps
 * @param {Array} contents
 */
export function prep (contents) {
  global.lineNo = 0;

  for (const line of contents) {
    global.lineNo++;
    if (isBlank(line) || isLabel(line)) {
      continue;
    }
    validate(line);
  }
}

/**
 * validate an instruction
 * @param {String} instruction
 * @param {boolean} [paramCount] the number of (macro) parameters the instruction accepts
 */
export function validate (instruction, paramCount = 0) {
  // edge case
  if (instruction === 'abcout') {
    throw new LineException('wrong number of arguments (0 given)');
  }

  let args = instruction.split(' ');

  if (!Util.isSeparated(args)) {
    throw new LineException('arguments must be comma-separated');
  }
  args = args.map(arg => arg.replace(/,/gm, ''));

  // integer validation
  for (const arg of args.filter(arg => isFinite(arg))) {
    if (arg > 32767) {
      throw new LineException('argument too big');
    }
    if (arg < 0) {
      throw new LineException('argument cannot be negative');
    }
    if (arg % 1 !== 0) {
      throw new LineException('argument cannot be a float');
    }
  }

  // macro parameter validation
  args.forEach(arg => {
    if (arg.startsWith('%')) {
      const param = Number(arg.slice(1));
      if (isNaN(param)) {
        throw new LineException(`invalid parameter value "${arg}"`);
      }
      if (param > paramCount - 1) {
        throw new LineException('parameter out of range');
      }
    }
  });

  if (isAbcout(instruction)) {
    if (args.length !== 2 && args.length !== 3) {
      throw new LineException(`wrong number of arguments (${args.length} given)`);
    }

    const [A, B, C] = args;
    // A and B validation
    if (!isFinite(A) && !isMacroParameter(A)) {
      throw new LineException('invalid value for argument A');
    }
    if (!isFinite(B) && !isMacroParameter(B)) {
      throw new LineException('invalid value for argument B');
    }

    // C validation
    if (isFinite(C)) {
      if (C % 6 !== 0) {
        throw new LineException('invalid value for argument C');
      }
    } else {
      if (C !== undefined && global.labels[C] === undefined) {
        if (!isMacroParameter(C)) {
          throw new LineException(`label "${C}" is undefined`);
        }
      }
    }
  } else {
    // name validation
    const name = args[0];
    if (!name.match(/[a-z_]([a-z0-9_]+)?/)) {
      throw new LineException(`invalid macro name "${name}"`);
    }
    if (global.macros[name] === undefined) {
      throw new LineException(`macro "${name}" is undefined`);
    }

    // arguments validation
    if (args.length - 1 !== global.macros[name].params) {
      throw new LineException(`wrong number of arguments (${args.length - 1} given)`);
    }
  }
}
