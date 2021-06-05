/*
  util.js
  ABCO-1 simulator utilities
  copyright (c) 2021 sporeball
  MIT license
*/

const chalk = require('chalk');

class Exception {
  constructor (message) {
    this.message = `${chalk.red('error:')} ${message}`;
  }
}

module.exports = { Exception };
