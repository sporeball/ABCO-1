/*
  display.js
  ABCO-1 simulator display file
  copyright (c) 2021 sporeball
  MIT license
*/

/**
 * write a value to the display at a specific address
 * @param {Number} address
 * @param {Number} value
 */
export function write (address, value) {
  global.display[address - 32736] = lookup[value] || '';
}

/**
 * return the nth line of the display as a string
 * @param {Number} n
 * @returns {string}
 */
export function line (n) {
  return global.display.slice((n - 1) * 16, n * 16)
    .join('');
}

export const lookup = '                                 !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[ ]^_`abcdefghijklmnopqrstuvwxyz{|}  ';
