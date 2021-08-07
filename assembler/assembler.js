/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

import assemble from './index.js';
import * as Util from './util.js';
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

function assembler () {
  const { file, out } = args;
  let contents;

  global.file = file;

  // get file contents, and normalize line endings to LF
  try {
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }));
  } catch (e) {
    throw new Exception('file not found');
  }

  let bytes = assemble(contents);
  const length = bytes.length;

  // pad with null bytes until 32K
  bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  // finish
  fs.writeFile(out, bytes, 'binary', () => {});
  Util.success('finished!');
  Util.summary(length);
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
