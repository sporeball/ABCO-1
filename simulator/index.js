/*
  index.js
  ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

import * as Util from './util.js';

/**
 * main function
 * @param {String} rom the ROM to simulate, cast to a string
 */
export default function simulate (rom) {
  const decompiled = Util.decompile(rom);
  const user = Array(32768).fill(0);
  let ptr = 0;
  let A, B, C = 0;
  let display = Array(32).fill(' ');

  user[0] = 1;

  console.log('decompiled code:');
  console.log(Util.prettify(decompiled));

  while (C !== 32767) {
    let instr = decompiled[ptr];
    [A, B, C] = instr;

    user[A] += user[B];
    if (user[A] > 255) {
      user[A] %= 256;
      ptr = C / 6;
    } else {
      ptr++;
    }
  }

  console.log('user space:');
  console.log(user);
}
