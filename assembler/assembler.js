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
  constructor(raw) {
    this.value = raw[0];
    this.start = raw.index; // start position (inclusive)
    this.end = this.start + this.value.length; // end position (exclusive)
  }
}

function assembler () {
  const { file, out } = args;
  let contents;

  // get file contents, and normalize line endings to LF
  try {
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }));
  } catch (e) { }

  // tokenize
  let tokens = contents.replace(/\n+$/g, '') // remove trailing
    .matchAll(/,|\n|[^\s,]+/g) // raw match
  tokens = [...tokens] // spread
    .map(tok => new Token(tok)); // convert

  // each token will start to gain some more information

  // lines and columns
  let ln = 1; // current line
  let cn = 1; // current column
  let lineStart = 0; // start value of line's first token
  tokens.forEach((tok, idx) => {
    // update column
    cn = tok.start - lineStart + 1;
    // assign
    tok.line = ln;
    tok.col = cn;
    // reset
    if (tok.value === '\n') {
      ln++;
      cn = 1;
      lineStart = tok.end;
    }
  });

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
