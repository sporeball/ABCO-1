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

class Token {
  constructor(raw, line, col) {
    this.value = raw[0];
    // at some point it should become apparent whether we need these fields
    // this.start = raw.index; // start position (inclusive)
    // this.end = this.start + this.value.length; // end position (exclusive)
    this.line = line;
    this.col = col;
  }
}

function assembler () {
  const { file, out } = args;
  let contents;

  // get file contents, and normalize line endings to LF
  try {
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }).trimEnd());
  } catch (e) { }

  let tokens = [];

  // scan
  let line = 1;
  let col = 1;
  // matches:
  // (1) comma
  // (2) newline
  // (3) consecutive spaces and/or tabs
  // (4) anything else
  for (let scan of contents.matchAll(/,|\n|[ \t]+|[^\s,]+/g)) {
    // tokenize
    const token = new Token(scan, line, col);
    tokens.push(token);
    // update position
    col += token.value.length;
    if (token.value === '\n') {
      line++;
      col = 1;
    }
  }

  // remove tokens matching (3)
  // we only scanned them to keep things sane when finding positions
  tokens = tokens.filter(token => !token.value.match(/^[ \t]+$/));

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
} catch (e) {
  console.error(e);
}
