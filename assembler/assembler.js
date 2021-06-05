/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

const Assembler = require('./index.js');
const { Exception } = require('./util.js');

const fs = require('fs');
const eol = require('eol');

const args = require('yeow')({
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
  // also normalizes line endings to CRLF
  try {
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }, () => {}));
  } catch (e) {
    throw new Exception('file not found');
  }

  Assembler.assemble(contents, args);
}

try {
  assembler();
} catch (e) {
  console.log(e.message);
}
