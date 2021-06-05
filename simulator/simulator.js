/*
  simulator.js
  interface to ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

const Simulator = require('./index.js');

const chalk = require('chalk');
const fs = require('fs');

const args = require('yeow')({
  file: {
    type: 'file',
    extensions: '.bin',
    required: true,
    missing: 'a file must be passed',
    invalid: 'improper file format'
  }
});

let contents;

function simulator () {
  const { file } = args;

  // get file contents
  try {
    contents = fs.readFileSync(file, { encoding: 'utf-8' }, () => {});
  } catch (e) {
    runnerErr('file not found');
  }

  Simulator.parse(contents);
}

const runnerErr = str => {
  console.log(chalk.red('error: ') + str);
  process.exit(1);
};

simulator();
