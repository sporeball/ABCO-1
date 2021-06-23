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
export const isParameter = arg => arg.match(/^%\d+$/);

/**
 * return whether the arguments of an instruction are properly comma-separated
 * @param {Array} args
 * @returns {boolean}
 */
export const isSeparated = args => {
  const instruction = args.join(' ');
  // if the instruction is a macro...
  if (isMacro(instruction)) {
    // the first argument should not end with a comma
    if (args[0].endsWith(',')) {
      return false;
    }
    // drop the macro name
    args = args.slice(1);
  }
  // the first remaining argument not ending with a comma should be the very last one
  return args.findIndex(x => !x.endsWith(',')) === args.length - 1;
};

/**
 * remove consecutive spaces in a string
 * @param {String} str
 * @returns {String}
 */
export const normalize = str => str.split(' ').filter(x => x !== '').join(' ');

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
 * produce a warning
 * @param {String} message
 */
export const warn = message => {
  console.log(`${chalk.yellow('warning:')} ${message}\n  ${chalk.cyan(`at line ${global.lineNo}`)}`);
};
