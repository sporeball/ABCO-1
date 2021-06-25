/*
  index.js
  ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

const haltCondition = String.fromCharCode(0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF);

/**
 * main function
 * @param {String} rom the ROM to simulate, cast to a string
 */
export default function simulate (rom) {
  const decompiled = decompile(rom);

  console.log('decompiled code:');
  console.log(decompiled);
}

/**
 * decompile a ROM into a list of instructions
 * @param {String} rom the raw ROM data to decompile
 * @returns {Array}
 */
function decompile (rom) {
  rom = rom.slice(0, rom.indexOf(haltCondition) + 6)
    .match(/.{6}/gs) // split by instruction (6 bytes)
    .map(instr => instr.match(/.{2}/gs)) // split by argument (2 bytes each)
    .flat()
    .map(pair => pair.split('').map(byte => byte.charCodeAt(0))) // convert bytes to integers
    .map(pair => (256 * pair[0]) + pair[1]); // combine pairs into single integers

  rom = [...Array(rom.length / 3)].map(x => rom.splice(0, 3)) // split in chunks of 3
    .map(instr => instr.join(', ')) // join each by argument
    .map(instr => 'abcout ' + instr); // prefix

  return rom;
}
