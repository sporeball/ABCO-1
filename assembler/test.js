/*
  test.js
  ABCO-1 assembler test suites
  copyright (c) 2021 sporeball
  MIT license
*/

import assemble from './index.js';
import { decompile, resetGlobalState } from './util.js';

import Tentamen from 'tentamen';

global.file = '[code]';

let tentamen = new Tentamen({
  fn: input => assemble(input),
  before: function (input) {
    return input.split('/')
      .map(instr => instr.replace(/,/gm, ', '))
      .join('\n');
  },
  after: function (output) {
    return decompile(output)
      .slice(0, -1);
  },
  error: e => e.message
});

tentamen.suite('simple cases');
tentamen.add('basic case', '1,2,0/3,4,6', [[1, 2, 0], [3, 4, 6]]);

tentamen.done();

