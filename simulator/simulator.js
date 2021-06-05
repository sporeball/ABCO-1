/*
  simulator.js
  interface to ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

const Simulator = require('./index.js');
const { Exception } = require('./util.js');

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
    contents = fs.readFileSync(file, { encoding: 'utf-8' });
  } catch (e) {
    throw new Exception('file not found');
  }

  Simulator.parse(contents);
}

try {
  simulator();
} catch (e) {
  console.log(e.message);
}
