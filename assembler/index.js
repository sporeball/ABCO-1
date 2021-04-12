/*
  index.js
  ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// dependencies
const fs = require("fs");
const chalk = require("chalk");

let l = 1;

function assemble(input) {
  let contents = input; // file contents
  let bytes = "";

  // strip trailing newline if present
  if (contents.slice(-2) == "\r\n") {
    contents = contents.slice(0, -2);
  }

  contents = contents.split("\r\n");

  for (let line of contents) {
    // ROM size is 32K, and we have to guarantee that space is left at the end of a theoretical filled ROM for 3 consecutive null bytes
    // this leads to a hard limit of 5,460 instructions
    if (bytes.length == 32760) {
      err("too many instructions");
    }

    // remove comments
    // skip if the line is or becomes empty
    if (line.indexOf(";") >= 0) {
      line = line.slice(0, line.indexOf(";")).trimEnd();
    }
    if (line == "") {
      l++;
      continue;
    }

    // remove mnemonic if given
    // (i like giving it, but others may not)
    if (line.slice(0, 6) == "abcout") {
      line = line.slice(6, line.length).trimStart();
    }

    let args = line.split(", ");
    if (args.length != 3) { err("wrong number of arguments"); }
    if (args[2] % 6 != 0) { err("invalid value for argument C"); }

    for (let arg of args) {
      let n;
      if (arg.slice(0, 1) == "$") {
        n = Number("0x" + arg.slice(1));
      } else {
        n = Number(arg);
      }

      if (isNaN(n)) { err("non-numeric argument given"); }

      if (n > 32767) {
        err("address too big");
      } else if (n > 255) {
        bytes += String.fromCharCode(n >> 8); // upper 8 bits of n
        bytes += String.fromCharCode(n & 255); // lower 8 bits of n
      } else {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(n);
      }
    }

    l++;
  }

  // pad with null bytes until 32K
  bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  fs.writeFile("rom.bin", bytes, "binary", function(){});
  success("finished!")
  return;
}

// utils
log = str => { console.log(chalk.white(str)) }
info = str => { log(chalk.cyan(str)) }
success = str => { log(chalk.green(str)) }
warn = str => { log(chalk.yellow(str)) }

err = str => {
  log(chalk.red("error: ") + str);
  info(`  at line ${l}`);
  process.exit(1);
}

// exports
exports.assemble = assemble;
