/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// import assemble from './index.js';

import tokenize from './tokenizer.js';
import parse from './parser.js';
import * as Assembler from './index.js';
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
  // pollution
  global.ASM = {};
  global.ASM.bytes = '';
  global.ASM.ptr = 0;
  global.ASM.labels = {};
  global.ASM.macros = {};

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

  // all top-level nodes in the AST should be either a command or some sort of
  // definition
  const invalid = AST.find(topLevelNode => {
    return (
      topLevelNode.type !== 'command' &&
      topLevelNode.type !== 'labelDefinition' &&
      topLevelNode.type !== 'macroDefinition'
    );
  });
  if (invalid) {
    throw new Error(`found bare token of type ${invalid.type}`);
  }

  for (const topLevelNode of AST) {
    Assembler.evaluateNode(topLevelNode);
  }

  // finished
  // pad with null bytes until 32K
  global.ASM.bytes += String.fromCharCode(0x00)
    .repeat(32768 - global.ASM.bytes.length);

  // write out
  fs.writeFile(out, global.ASM.bytes, 'binary', () => {});
}

/**
 * evaluate an AST node, returning a value
 * @param {object} ASTNode
 */
// function evaluateNode (ASTNode) {
//   switch (ASTNode.type) {
//     case 'command':
//       return new Assembler.Command(ASTNode);
//     case 'labelDefinition':
//       return new Assembler.Label(ASTNode);
//     case 'macroDefinition':
//       return new Assembler.Macro(ASTNode);
//   }
// }

// main
try {
  assembler();
} catch (e) {
  console.error(e);
}
