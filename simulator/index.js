/*
  index.js
  ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Util from './util.js';
import * as Display from './display.js';

// this is the most counter-intuitive syntax of all time
import logUpdate from 'log-update';

global.display = Array(32).fill(' ');

/**
 * main function
 * @param {String} rom the ROM to simulate, cast to a string
 */
export default function simulate (rom) {
  const user = Array(32768).fill(0);
  let ptr = 0;
  let A = 0;
  let B = 0;
  let C = 0;

  const decompiled = Util.decompile(rom);

  user[0] = 1;

  while (C !== 32767) {
    const instr = decompiled[ptr];
    [A, B, C] = instr;
    // logUpdate(`currently executing: ${instr.join(', ')}`);

    user[A] += user[B];
    if (user[A] > 255) {
      user[A] %= 256;
      ptr = C / 6;
    } else {
      ptr++;
    }

    if (A >= 32736) {
      Display.write(A, user[A]);
    }
  }

  console.log('userland:');
  console.log(user);

  console.log('output:');
  Display.show();
}
