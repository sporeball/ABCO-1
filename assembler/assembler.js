/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// import assemble from './index.js';

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

  // get file contents, and normalize line endings to LF
  try {
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }));
  } catch (e) { }

  let tokens = contents.replace(/^[\t ]+/gm, '') // mapped trim
    .replace(/\n+$/g, '') // remove trailing
    .matchAll(/,|\n|[^\s,]+/g) // raw tokenize
  tokens = [...tokens]; // spread

  console.log(tokens);

  // let bytes = assemble(contents);
  // const length = bytes.length;

  // pad with null bytes until 32K
  // bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  // finish
  // fs.writeFile(out, bytes, 'binary', () => {});
}

try {
  assembler();
} catch (e) { }
