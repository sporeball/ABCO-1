/*
  util.js
  ABCO-1 assembler utilities
  copyright (c) 2021 sporeball
  MIT license
*/

import chalk from 'chalk';

// log levels
export const info = str => {
  console.log(chalk.cyan(str));
};

export const success = str => {
  console.log(chalk.green(str));
};

// error classes
export class Exception {
  constructor (message) {
    this.message = chalk`{red error:} ${message}`;
  }
}

export class LineException {
  constructor (message) {
    this.message = chalk`{red error:} ${message}\n{cyan ${trace()}}`;
  }
}

/**
 * cast a string containing arguments to an array
 * @param {String} str
 * @returns {Array}
 */
export const argify = str => str.split(', ');

/**
 * @param {String} line
 * @returns {boolean}
 */
export const isAbcout = line => line.match(/^\d+(,| )?|^[^, ]+?,/);

/**
 * @param {String} line
 * @returns {boolean}
 */
export const isBlank = line => line === '';

/**
 * @param {String} line
 * @returns {boolean}
 */
export const isImport = line => line.startsWith('@');

/**
 * @param {String} line
 * @returns {boolean}
 */
export const isLabel = line => line.endsWith(':');

/**
 * @param {String} line
 * @returns {boolean}
 */
export const isMacro = line => line.match(/^[^\d, %]+ |^[^\d, :%]+$/);

/**
 * @param {String} arg
 * @returns {boolean}
 */
export const isMacroParameter = arg => arg.match(/^%\d+$/);

/**
 * return whether the arguments to an instruction or import are properly comma-separated
 * @param {Array} args
 * @returns {boolean}
 */
export const isSeparated = args => {
  const instruction = args.join(' ');
  // if we are validating a macro or import...
  if (isMacro(instruction) || isImport(instruction)) {
    // the first item should not end with a comma
    if (args[0].endsWith(',')) {
      return false;
    }
    // drop the first item
    args = args.slice(1);
  }
  // the first remaining argument not ending with a comma should be the very last one
  return args.findIndex(x => !x.endsWith(',')) === args.length - 1;
};

/**
 * @param {String} arg
 * @returns {boolean}
 */
export const isScopedLabel = arg => arg.startsWith('#');

/**
 * remove consecutive spaces in a string
 * @param {String} str
 * @returns {String}
 */
export const normalize = str => str.replace(/ +/g, ' ');

/**
 * cast all hex literals (0xABC) in a string to numbers
 * immediately throws if this results in NaN
 * @param {String} str
 * @returns {String}
 */
export const parseHex = str => {
  str = str.replace(/0x[^ \n,]+/gm, match => {
    const cast = Number(match);
    if (isNaN(cast)) {
      throw new LineException('invalid hex literal');
    } else {
      return cast;
    }
  });
  return str;
};

/**
 * pop an item from the global call stack
 */
export const popStack = () => {
  const stack = global.callStack;
  stack.namespaces.shift();
  global.lineNo = stack.lines.shift();
};

/**
 * push an item to the global call stack
 * @param {String} namespace the space to move into
 */
export const pushStack = namespace => {
  const stack = global.callStack;
  stack.namespaces.unshift(namespace);
  stack.lines.unshift(global.lineNo);
};

/**
 * produce a summary of the final written file
 * @param {Number} length file length
 */
export const summary = length => {
  console.log(chalk`wrote {cyan 32kB total} / {blue ${length}B source} (${length / 6} instructions)`);
};

/**
 * produce a stack trace
 */
export const trace = () => {
  const stack = global.callStack;
  const traceArray = Array(stack.namespaces.length)
    .fill(undefined);

  // add where we are now
  stack.lines.unshift(global.lineNo);

  return traceArray.map((x, i) => `  at ${stack.namespaces[i]}:${stack.lines[i]}`)
    .join('\n');
};

/**
 * produce a warning
 * @param {String} message
 */
export const warn = message => {
  console.log(chalk`{yellow warning:} ${message}\n  {cyan at line ${global.lineNo}}`);
};
