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
  constructor(value, line, col) {
    this.value = value;
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
    const value = scan[0];
    // only add tokens that do not match (3) to the token stream...
    if (!value.match(/[ \t]+/)) {
      tokens.push(new Token(value, line, col));
    }
    // but update our position in the source file regardless
    col += value.length;
    if (value === '\n') {
      line++;
      col = 1;
    }
  }

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
