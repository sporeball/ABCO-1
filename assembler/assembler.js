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
  global.ASM = {
    bytes: '',
    ptr: 0,
    labels: {},
    macros: {}
  };

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

  // console.dir(AST, { depth: null });

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

  // step 1: determine length of macros
  // grab from the AST
  for (const macro of AST.filter(tln => tln.type === 'macroDefinition')) {
    const { name, params, contents } = macro;
    // get the total length of node contents
    const length = contents.map(Assembler.nodeLength)
      .reduce((a, c) => a + c, 0);
    // intermediate value
    global.ASM.macros[name] = {
      params,
      contents,
      length
    }
  }

  // step 2: determine local label addresses
  for (const macro of Object.values(global.ASM.macros)) {
    let ptr = 0;
    macro.labels = {};
    for (const node of macro.contents) {
      ptr += Assembler.nodeLength(node);
      if (node.type === 'macroLabelDefinition') {
        macro.labels[node.name] = ptr;
      }
    }
  }

  // step 3: determine global label addresses
  for (const topLevelNode of AST) {
    global.ASM.ptr += Assembler.nodeLength(topLevelNode);
    if (topLevelNode.type === 'labelDefinition') {
      global.ASM.labels[topLevelNode.name] = global.ASM.ptr;
    }
  }

  // console.log(global.ASM.labels);

  // step 4: create program bytecode
  // TODO: memoize macro bytecode
  global.ASM.ptr = 0;
  for (const command of AST.filter(tln => tln.type === 'command')) {
    // console.log(command);
    Assembler.genBytecode(command);
  }

  // finished
  // pad with null bytes until 32K
  global.ASM.bytes += String.fromCharCode(0x00)
    .repeat(32768 - global.ASM.bytes.length);

  // write out
  fs.writeFile(out, global.ASM.bytes, 'binary', () => {});
}

// main
try {
  assembler();
} catch (e) {
  console.error(e);
}
