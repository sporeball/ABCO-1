/*
  test.js
  ABCO-1 assembler test suites
  copyright (c) 2021 sporeball
  MIT license
*/

import assemble from './index.js';
import { decompile, resetGlobalState } from './util.js';

import Tentamen from 'tentamen';

const test = input => {
  return assemble(input);
}

let tentamen = new Tentamen({
  fn: input => test(input),
  before: input => {
    return input.split('/')
      .map(instr => instr.replace(/,/gm, ', '))
      .join('\n');
  },
  after: output => {
    resetGlobalState();
    return decompile(output)
      .slice(0, -1)
      .join(',');
  }
});

tentamen.suite('simple cases');
tentamen.add('basic case', '1,2,0/3,4,6', '1,2,0,3,4,6');

tentamen.done();

