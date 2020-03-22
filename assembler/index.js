/*
  index.js
  ABCO-1 assembler
  copyright (c) 2020 sporeball
  MIT license
*/

// dependencies
const fs = require("fs");

function assemble(input) {
  var contents = input; // file contents
  var bytes = "";

  // strip trailing newline if present
  if (contents.slice(-2) == "\r\n") {
    contents = contents.slice(0, -2);
  }

  contents = contents.split("\r\n");

  for (var i = 0; i < contents.length; i++) {
    let str = contents[i];
    bytes += String.fromCharCode(Number(str.slice(7, str.length).split(", ")[0]));
    bytes += String.fromCharCode(Number(str.slice(7, str.length).split(", ")[1]));
    bytes += String.fromCharCode(Number(str.slice(7, str.length).split(", ")[2]));
  }

  bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  fs.writeFile("rom.bin", bytes, "binary", function(){});
  return;
}

// exports
exports.assemble = assemble;
