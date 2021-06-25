/*
  macro.js
  ABCO-1 assembler macro handler
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Instruction from './instruction.js';
import { LineException, isAbcout } from './util.js';

/**
 * macro preparation function
 * asserts that all macro definitions are properly balanced, and that (at a minimum) all openings begin with '%macro'
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
    } else if (line.match(/^%\d+/)) {
      // assume it's okay for now
      continue;
    } else {
      throw new LineException('invalid use of %');
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
 * create a macro object from an array of its lines
 * @param {Array} macro
 */
export function create (macro) {
  const dependencies = [];

  // should yield an array with name and parameter count, if valid
  const opening = macro[0].split(' ').slice(1);
  if (opening.length > 2) {
    throw new LineException('macro opening statement has too many parts');
  }

  // move the opening elements to the front of the array
  macro.splice(0, 1, ...opening);

  let [name, params, ...lines] = macro;
  lines = lines.slice(0, -1); // remove the closing line
  validate(name, params, lines);

  // validate and expand all the lines of this macro
  lines = lines.flatMap(line => {
    global.lineNo++;
    Instruction.validate(line, params);
    if (isAbcout(line)) {
      return line;
    } else {
      const dep = line.split(' ').filter(x => x !== '')[0];
      dependencies.push(dep);
      return expand(line);
    }
  });

  // create it
  global.macros[name] = {
    calls: 0,
    params: Number(params),
    dependencies: dependencies,
    lines: lines
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
  const [name, ...args] = instruction.split(' ');

  if (top) {
    global.macros[name].calls++;
    for (const dep of global.macros[name].dependencies) {
      global.macros[dep].calls++;
    }
  }

  const lines = global.macros[name].lines;
  // fill in parameters (%n)
  for (let i = 0; i < lines.length; i++) {
    lines[i] = fillAll(lines[i], args);
  }

  // validate again
  for (const line of lines) {
    try {
      Instruction.validate(line);
    } catch (e) {
      throw new LineException('parameter rendered invalid after expansion');
    }
  }

  return lines;
}

/**
 * validate a macro based on its parts
 * @param {String} name
 * @param {Number} params
 * @param {Array} lines
 */
function validate (name, params, lines) {
  // name validation
  if (name === 'abcout') {
    throw new LineException('"abcout" cannot be used as a macro name');
  }
  if (!name.match(/^[a-z_]([a-z0-9_]+)?$/)) {
    throw new LineException(`invalid macro name "${name}"`);
  }
  if (global.macros[name] !== undefined) {
    throw new LineException(`macro "${name}" already defined`);
  }

  // parameter validation
  if (isNaN(params)) {
    throw new LineException('macro parameter count missing or invalid');
  }

  // lines validation
  // catch circular dependence
  const idx = lines.findIndex(x => x.split(' ')[0] === name);
  if (idx !== -1) {
    global.lineNo += (idx + 1);
    throw new LineException(`macro "${name}" cannot call itself`);
  }
}

/**
 * fill in all macro parameters passed to an instruction
 * @param {String} instruction
 * @param {Array} params
 */
function fillAll (instruction, params) {
  for (let param = 0; param < params.length; param++) {
    const exp = new RegExp(`%${param}`, 'g');
    instruction = instruction.replace(exp, params[param]);
  }
  return instruction;
}
