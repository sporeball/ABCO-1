/*
  macro.js
  ABCO-1 assembler macro handler
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Instruction from './instruction.js';
import * as Label from './label.js';
import { LineException, isAbcout, isBlank, isLabel, isMacro, isScopedLabel } from './util.js';

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
  const labels = []; // labels defined by this macro
  const dependencies = []; // other macros called by this macro
  const openingLine = global.lineNo;

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

  // collect labels
  for (const line of lines) {
    global.lineNo++;
    if (isLabel(line)) {
      Label.validate(line, labels);
      labels.push(line.slice(0, -1));
    }
  }

  global.lineNo = openingLine;

  // validate and expand all the lines of this macro
  lines = lines.flatMap(line => {
    global.lineNo++;

    if (isAbcout(line) || isMacro(line)) {
      Instruction.validate(line, labels, params);
    }

    if (isMacro(line)) {
      const dep = line.split(' ').filter(x => x !== '')[0];
      dependencies.push(dep);
      return expand(line, false, labels);
    } else {
      return line;
    }
  });

  // create it
  global.macros[name] = {
    calls: 0,
    params: Number(params),
    dependencies: dependencies,
    labels: labels,
    lines: lines
  };
}

/**
 * return the expansion of a macro instruction
 * @param {Object} instruction
 * @param {boolean} [top] whether this expansion is occurring in the main code
 * @param {Array} [labels] additional macro labels accessible to this instruction
 * @returns {Array}
 */
export function expand (instruction, top = false, labels = []) {
  // macro_name A, B, C, ...
  let [name, ...args] = instruction.split(' ');
  const { params, dependencies } = global.macros[name];
  const lines = [...global.macros[name].lines];
  labels = labels.concat(global.macros[name].labels);

  args = args.map(arg => arg.replace(/,/gm, ''));

  if (top) {
    global.macros[name].calls++;
    for (const dep of dependencies) {
      global.macros[dep].calls++;
    }
  }

  const calls = global.macros[name].calls;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isBlank(line)) {
      continue;
    } else if (isLabel(line)) {
      if (top) {
        // create a unique scoped label name
        // requires the macro name, original label name, and call count
        lines[i] = `M${name}_${line.slice(0, -1)}_${calls}:`;
      }
    } else {
      lines[i] = fillParameters(line, args);
      if (top) {
        lines[i] = fillScoped(lines[i], name, calls);
      }
      // validate again
      try {
        Instruction.validate(lines[i], labels, params);
      } catch (e) {
        throw new LineException('parameter rendered invalid after expansion');
      }
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
 * fill in all macro parameters (%n) passed as arguments to an instruction
 * @param {String} instruction
 * @param {Array} params the actual parameters that matching arguments should be replaced by
 * @returns {String}
 */
function fillParameters (instruction, params) {
  const args = instruction.split(', ');

  // array of booleans
  // if any element is true, the corresponding argument to the instruction cannot be changed anymore
  const frozen = args.map(arg => false);

  // for each macro parameter...
  for (let n = 0; n < params.length; n++) {
    // for each argument to the original instruction...
    for (let arg = 0; arg < args.length; arg++) {
      if (args[arg] === `%${n}`) {
        // skip if it's frozen
        if (frozen[arg]) {
          continue;
        }
        args[arg] = params[n]; // replace the argument
        frozen[arg] = true; // freeze
      }
    }
  }

  return args.join(', ');
}

/**
 * replace all scoped labels in an instruction with new unique names
 * @param {String} instruction
 * @param {String} name the name of the macro the instruction is within
 * @param {Number} calls the macro's number of calls
 */
function fillScoped (instruction, name, calls) {
  const args = instruction.split(', ');

  // for each argument to the instruction...
  for (let arg = 0; arg < args.length; arg++) {
    if (isScopedLabel(args[arg])) {
      const label = args[arg].slice(1);
      args[arg] = `M${name}_${label}_${calls}`;
    }
  }

  return args.join(', ');
}
