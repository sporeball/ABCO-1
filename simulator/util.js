/*
  util.js
  ABCO-1 simulator utilities
  copyright (c) 2021 sporeball
  MIT license
*/

import chalk from 'chalk';

export class Exception {
  constructor (message) {
    this.message = `${chalk.red('error:')} ${message}`;
  }
}
