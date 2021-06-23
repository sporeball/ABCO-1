/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

import assemble from './index.js';
import { Exception, LineException, info } from './util.js';

import fs from 'fs';
import eol from 'eol';
import chalk from 'chalk';
import yeow from 'yeow';

const args = yeow({
  file: {
    type: 'file',
    extensions: '.abcout',
    required: true,
    missing: 'a file must be passed',
    invalid: 'improper file format'
  },
  out: {
    type: 'file',
    extensions: '.bin',
    aliases: '-o / --out',
    default: 'rom.bin',
    invalid: 'improper file format'
  }
});

let contents;

function assembler () {
  const { file } = args;

  // get file contents
  // also normalizes line endings to LF
  try {
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }));
  } catch (e) {
    throw new Exception('file not found');
  }

  assemble(contents, args);
}

try {
  assembler();
} catch (e) {
  if (e instanceof Exception || e instanceof LineException) {
    console.log(e.message);
  } else {
    console.log(chalk.red('uncaught error'));
    info('this probably has nothing to do with your program; maybe file an issue?\n');
    console.log(e);
  }
}
