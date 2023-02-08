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

  // const decompiled = Util.decompile(rom);

  user[1] = 1;

  for (let i = 0; i < 1000000; i++) {
    if (ptr === 32736) {
      break;
    }

    let A = 0;
    let B = 0;
    let C = 0;

    A += rom[ptr].charCodeAt(0) * 256;
    ptr++;
    A += rom[ptr].charCodeAt(0);
    ptr++;
    B += rom[ptr].charCodeAt(0) * 256;
    ptr++;
    B += rom[ptr].charCodeAt(0);
    ptr++;
    C += rom[ptr].charCodeAt(0) * 256;
    ptr++;
    C += rom[ptr].charCodeAt(0);

    user[A] += user[B];
    if (user[A] > 255) {
      user[A] %= 256;
      ptr = C;
      // console.log('branching to address', C);
    } else {
      ptr++;
    }

    if (A >= 32736) {
      Display.write(A, user[A]);
      logUpdate(`${Display.line(1)}\n${Display.line(2)}`);
    }
  }

  // console.log('userland:');
  // console.log(user);

  // console.log('output:');
}
