/*
  util.js
  ABCO-1 assembler utilities
  copyright (c) 2021 sporeball
  MIT license
*/

import chalk from 'chalk';

// log levels
export const info = str => console.log(chalk.cyan(str));
export const success = str => console.log(chalk.green(str));

// error classes
export class Exception {
  constructor (message) {
    this.message = `${chalk.red('error:')} ${message}`;
  }
}

export class LineException {
  constructor (message) {
    this.message = `${chalk.red('error:')} ${message}\n  ${chalk.cyan(`at line ${global.lineNo}`)}`;
  }
}

/**
 * cast a string containing arguments to an array
 * @param {String} str
 * @returns {Array}
 */
export const argify = str => str.replace(/,/gm, '').split(' ');

/**
 * find all indices of a value in an array (1-indexed)
 * @param val
 * @param {Array} arr
 * @returns {Array}
 */
export const findIndices = (val, arr) => arr.map((x, i) => x === val ? i + 1 : '').filter(x => x !== '');

/**
 * return whether an instruction is a macro (anything other than abcout)
 * does not validate
 * @param instr
 * @returns {boolean}
 */
export const isMacro = instr => instr.match(/^[a-z_]([a-z0-9_]+)?[^\n:]*$/gm);

/**
 * return whether the arguments of an instruction are properly comma-separated
 * @param {Array} args
 * @param {boolean} isMacro whether the instruction is a macro
 * @returns {boolean}
 */
export const isSeparated = (args, isMacro) => {
  // if the instruction is a macro...
  if (isMacro) {
    // the first argument should not end with a comma
    if (args[0].endsWith(',')) {
      return false;
    }
    // drop the macro name
    args = args.slice(1);
  }
  // the first remaining argument not ending with a comma should be the very last one
  return args.findIndex(x => !x.match(/^[^,]+,$/)) === args.length - 1;
};

/**
 * remove consecutive spaces in a string
 * @param str
 * @returns {String}
 */
export const normalize = str => str.split(' ').filter(x => x !== '').join(' ');

/**
 * cast all hex literals (0xABC) in a string to numbers
 * immediately throws if this results in NaN
 * @param str
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
 * return all array values matching a regular expression
 * @param {RegExp} exp
 * @param {Array} arr
 * @returns {Set}
 */
export const setOf = (exp, arr) => [...new Set(arr.filter(x => x.match(exp)))];

/**
 * produce a warning
 * @param {String} message
 */
export const warn = message => console.log(`${chalk.yellow('warning:')} ${message}\n  ${chalk.cyan(`at line ${global.lineNo}`)}`);
