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
  after: function (output) {
    return decompile(output)
      .slice(0, -1);
  },
  error: e => e.stack,
  afterError: e => {
    const message = stripAnsi(e).split('\n')[0];
    return message.slice(message.indexOf(':') + 2);
  }
});

/*
  base cases
*/
tentamen.suite('base cases');

tentamen.add(
  'simple case',
  `1, 0, 0
  1, 1, 0`,
  [[1, 0, 0], [1, 1, 0]]
);
tentamen.add(
  'hex use',
  '$100, 0, 0',
  [[256, 0, 0]]
);
tentamen.add(
  'C replacement',
  `1, 0
  1, 1`,
  [[1, 0, 6], [1, 1, 12]]
);

// errors
tentamen.add(
  'invalid hex use',
  '$invalid, 0',
  'invalid hex literal'
);

/*
  labels
*/
tentamen.suite('labels');

tentamen.add(
  'basic usage',
  `1, 0, 0
  label:
  1, 1, label`,
  [[1, 0, 0], [1, 1, 6]]
);

// errors
tentamen.add(
  'invalid label name',
  `Start:
  1, 1, 0`,
  'invalid label name "Start"'
);
tentamen.add(
  'duplicate label',
  `start:
  1, 0, 0
  start:
  1, 1, 0`,
  'label "start" already in use'
);

/*
  macros
*/
tentamen.suite('macros');

tentamen.add(
  'basic usage',
  `%macro start 0
    1, 0, 0
    1, 1, 0
  %endmacro
  start`,
  [[1, 0, 0], [1, 1, 0]]
);
tentamen.add(
  'parameter usage',
  `%macro double 1
    %0, %0
  %endmacro
  double 10`,
  [[10, 10, 6]]
);

// errors
tentamen.add(
  'invalid macro name',
  `%macro Start 0
    1, 0, 0
  %endmacro`,
  'invalid macro name "Start"'
);
tentamen.add(
  'unmatched statement',
  `%macro unclosed 0
    1, 0, 0`,
  'unmatched macro opening statement'
);
tentamen.add(
  'nesting',
  `%macro outer 0
    %macro inner 0
      1, 0, 0
    %endmacro
  %endmacro`,
  'macros cannot define other macros'
);
tentamen.add(
  'parameter out of range',
  `%macro thing 0
    1, 1, %0
  %endmacro`,
  'parameter out of range'
);
tentamen.add(
  'parameter rendered invalid',
  `%macro thing 1
    0, 0, %0
  %endmacro
  thing 3`,
  'parameter rendered invalid after expansion'
);

/*
  imports
*/
tentamen.suite('imports');

// if this test passes, we can assume that imports are working properly,
// since import * performs less work than an import of this form
tentamen.add(
  'single import',
  `@import jmp from ../prog/toolbox
  jmp 12`,
  [[0, 7, 6], [0, 7, 12]]
);

// errors
tentamen.add(
  'malformed statement',
  '@import something somewhere',
  'malformed import statement'
);

tentamen.done();
