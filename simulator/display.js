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
  global.display[address - 32736] = lookup[value];
}

/**
 * show the contents of the display as two lines
 * this will discard it!
 */
export function show () {
  return [...Array(2)]
    .map(x => global.display.splice(0, 16).join(''))
    .map(x => console.log(x));
}

export const lookup = '                 !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[ ]^_`abcdefghijklmnopqrstuvwxyz{|}  ';
