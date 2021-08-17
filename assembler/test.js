/*
  test.js
  ABCO-1 assembler test suites
  copyright (c) 2021 sporeball
  MIT license
*/

import assemble from './index.js';
import { decompile } from './util.js';

import stripAnsi from 'strip-ansi';
import Tentamen from 'tentamen';

global.file = '[code]';

const tentamen = new Tentamen({
  fn: input => assemble(input),
  before: function (input) {
    return input.replace(/:/gm, ':/')
      .split('/')
      .map(instr => instr.replace(/,/gm, ', '))
      .join('\n');
  },
  after: function (output) {
    return decompile(output)
      .slice(0, -1);
  },
  error: e => {
    if (e instanceof Error) {
      return e.stack;
    } else {
      return e.message + '\n' + e.stack;
    }
  },
  afterError: e => {
    let message = stripAnsi(e).split('\n')[0];
    return message.slice(message.indexOf(':') + 2);
  }
});

tentamen.suite('base cases');
tentamen.add('simple case', '1,0,0/1,1,0', [[1, 0, 0], [1, 1, 0]]);
tentamen.add('hex use', '$100,0,0', [[256, 0, 0]]);
tentamen.add('C replacement', '1,0/1,1', [[1, 0, 6], [1, 1, 12]]);
tentamen.add('invalid hex use', '$invalid,0', 'invalid hex literal');

tentamen.suite('labels');
tentamen.add('basic usage', '1,0,0/label:1,1,label', [[1, 0, 0], [1, 1, 6]]);
tentamen.add('invalid label name', 'Start:1,0,0', 'invalid label name "Start"');
tentamen.add('duplicate label', 'start:1,0,0/start:1,1,0', 'label "start" already in use');

tentamen.done();
