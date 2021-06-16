/*
  simulator.js
  interface to ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

import simulate from './index.js';
import { Exception } from './util.js';

import fs from 'fs';
import yeow from 'yeow';

const args = yeow({
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

  simulate(contents);
}

try {
  simulator();
} catch (e) {
  console.log(e.message);
}
