/*
  util.js
  ABCO-1 assembler utilities
  copyright (c) 2021 sporeball
  MIT license
*/

const chalk = require("chalk");

// log levels
const info = str => console.log(chalk.cyan(str));
const success = str => console.log(chalk.green(str));

// error classes
class Exception {
  constructor(message) {
    this.message = `${chalk.red("error:")} ${message}`;
  }
}

class LineException {
  constructor(message) {
    this.message = `${chalk.red("error:")} ${message}\n  ${chalk.cyan(`at line ${global.lineNo}`)}`;
  }
}

/**
 * finalize the arguments of an instruction from their intermediate form
 * @param args
 * @returns {Array}
 */
const argify = args => {
  if (typeof args === "string") { args = args.split(" "); }
  if (!isSeparated(args)) { throw new LineException("arguments must be comma-separated"); }
  return args.map(x => x.endsWith(",") ? x.slice(0, -1) : x);
}

/**
 * find all indices of a value in an array (1-indexed)
 * @param val
 * @param {Array} arr
 * @returns {Array}
 */
const findIndices = (val, arr) => arr.map((x, i) => x == val ? i + 1 : "").filter(x => x != "");

/**
 * return whether an instruction is a macro (anything other than abcout)
 * does not validate
 * @param instr
 * @returns {boolean}
 */
const isMacro = instr => instr.match(/^[a-z_]([a-z0-9_]+)?[^\r\n:]*$/gm);

/**
 * validates comma separation
 * @param {Array} args
 * @returns {boolean}
 */
const isSeparated = args => args.findIndex(x => !x.match(/^[^, ]+,$/)) + 1 == args.length;

/**
 * remove consecutive spaces in a string
 * @param str
 * @returns {String}
 */
const normalize = str => str.split(" ").filter(x => x != "").join(" ");

/**
 * return all array values matching a regular expression
 * @param {RegExp} exp
 * @param {Array} arr
 * @returns {Set}
 */
const setOf = (exp, arr) => [...new Set(arr.filter(x => x.match(exp)))];

/**
 * produce a warning
 * @param {String} message
 */
const warn = message => console.log(`${chalk.yellow("warning:")} ${message}\n  ${chalk.cyan(`at line ${global.lineNo}`)}`);

module.exports = { Exception, LineException, info, success, argify, findIndices, isMacro, normalize, setOf, warn };
