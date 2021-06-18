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
 * finalize the arguments of an instruction from their intermediate form
 * @param args
 * @returns {Array}
 */
export const argify = args => {
  if (typeof args === 'string') { args = args.split(' '); }
  if (!isSeparated(args)) { throw new LineException('arguments must be comma-separated'); }
  return args.map(x => x.endsWith(',') ? x.slice(0, -1) : x);
};

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
 * validate comma separation
 * @param {Array} args
 * @returns {boolean}
 */
export const isSeparated = args => args.findIndex(x => !x.match(/^[^, ]+,$/)) + 1 === args.length;

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
