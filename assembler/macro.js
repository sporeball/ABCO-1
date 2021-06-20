/*
  macro.js
  ABCO-1 assembler macro handler
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Util from './util.js';
import { LineException } from './util.js';

/**
 * macro preparation function
 * asserts that all macro definitions are properly balanced,
 * and that (at a minimum) all openings begin with '%macro'
 * @param {Array} contents
 */
export function prep (contents) {
  global.lineNo = 0;
  const stack = [];
  const openings = [];
  let maxLength = 0;
  let maxNestedOpening;

  for (const line of contents) {
    global.lineNo++;
    if (!line.startsWith('%')) {
      continue;
    }

    if (line.startsWith('%macro ')) {
      if (openings.includes(line)) {
        throw new LineException('an identical opening statement already exists');
      }
      stack.push(line);
      openings.push(line);
    } else if (line === '%endmacro') {
      if (stack.length === 0) {
        throw new LineException('unmatched macro closing statement');
      }
      stack.pop();
    } else {
      throw new LineException('malformed macro definition');
    }

    if (stack.length > maxLength) {
      maxLength = stack.length;
      maxNestedOpening = openings[openings.length - 1];
    }
  }

  // if something is left on the stack, the statements are unbalanced
  if (stack.length > 0) {
    global.lineNo = contents.indexOf(stack[stack.length - 1]) + 1;
    throw new LineException('unmatched macro opening statement');
  }

  // only complain about nested macros if the statements are balanced
  if (maxLength > 1) {
    global.lineNo = contents.indexOf(maxNestedOpening) + 1;
    throw new LineException('macros cannot define other macros');
  }
}

/**
 * create a macro object from a multiline string containing one
 * @param {String} macro
 */
export function create (macro) {
  macro = macro.split('\n');
  const dependencies = [];

  // should yield an array with name and parameter count, if valid
  const opening = macro[0].split(' ').slice(1);
  if (opening.length > 2) {
    throw new LineException('macro opening statement has too many parts');
  }

  // move the opening elements to the front of the array
  macro.splice(0, 1, ...opening);

  let [name, params, ...lines] = macro;
  validate(name, params, lines);

  // expand the macros this macro depends on
  lines = lines.flatMap(line => {
    global.lineNo++;
    if (Util.isMacro(line)) {
      const dep = line.split(' ').filter(x => x !== '')[0];
      dependencies.push(dep);
      return expand(line);
    } else {
      return line;
    }
  });

  // create it
  global.macros[name] = {
    calls: 0,
    params: Number(params),
    dependencies: dependencies,
    lines: lines.slice(0, -1)
  };
}

/**
 * return the expansion of a macro instruction
 * @param {Object} instruction
 * @param {boolean} [top] whether this expansion is occurring in the main code
 * @returns {Array}
 */
export function expand (instruction, top = false) {
  // macro_name A, B, C, ...
  const [name] = instruction.split(' ');
  if (global.macros[name] === undefined) { throw new LineException(`macro "${name}" is undefined`); }

  if (top) {
    global.macros[name].calls++;
    for (const dep of global.macros[name].dependencies) {
      global.macros[dep].calls++;
    }
  }

  return global.macros[name].lines;
}

/**
 * validate a macro based on its parts
 * @param {String} name
 * @param {Number} params
 * @param {Array} lines
 */
function validate (name, params, lines) {
  // name validation
  if (name === 'abcout') { throw new LineException('"abcout" cannot be used as a macro name'); }
  if (!name.match(/^[a-z_]([a-z0-9_]+)?$/)) { throw new LineException('invalid macro name'); }
  if (global.macros[name] !== undefined) throw new LineException(`macro "${name}" already defined`);

  // parameter validation
  if (isNaN(params)) { throw new LineException('macro parameter count missing or invalid'); }

  // lines validation
  // catch circular dependence
  const idx = lines.findIndex(x => x.split(' ')[0] === name);
  if (idx !== -1) {
    global.lineNo += (idx + 1);
    throw new LineException(`macro "${name}" cannot call itself`);
  }
}
