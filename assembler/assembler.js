/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// import assemble from './index.js';

import tokenize from './tokenizer.js';
import parse from './parser.js';
import fs from 'fs';
import eol from 'eol';
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
    contents = eol.lf(fs.readFileSync(file, { encoding: 'utf-8' }).trim());
  } catch (e) { }

  contents = contents.split('\n')
    .map(line => line.replace(/;.*/gm, '').trim()); // clean

  if (contents.at(-1).length === 0) {
    contents = contents.slice(0, -1);
  }

  contents = contents.join('\n');
  const tokens = tokenize(contents);
  const AST = parse(tokens);
  console.dir(AST, { depth: null });
  // console.log(tokens);

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
