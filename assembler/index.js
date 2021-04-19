/*
  index.js
  ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// dependencies
const fs = require("fs");
const chalk = require("chalk");

let lineNo = 1;
let ip = 0;
let table = {}; // symbol table (for labels)

function assemble(input) {
  let contents = input; // file contents
  let bytes = "";

  // strip trailing newline if present
  if (contents.slice(-2) == "\r\n") {
    contents = contents.slice(0, -2);
  }

  // remove comments from lines, and trim the beginnings
  // lines which only contain a comment will be reduced to the empty string
  contents = contents.split("\r\n")
    .map(x => x.indexOf(";") >= 0 ? x.slice(0, x.indexOf(";")).trimEnd() : x)
    .map(x => x.trimStart());

  // first pass
  // assemble symbol table
  for (let line of contents) {
    if (line.match(/^[a-z_]([a-z0-9_]+)?:$/)) {
      if (table[line.slice(0, -1)] !== undefined) { err("label already in use"); }
      table[line.slice(0, -1)] = String(ip);
    // if the line is not empty, assume there is a valid instruction there
    // even if there isn't, the problem will be caught on the second pass
    } else if (!line.match(/^$/)) {
      ip += 6;
    }

    lineNo++;
  }

  lineNo = 1;

  // second pass
  // assemble the ROM
  for (let line of contents) {
    // ROM size is 32K, and we have to guarantee that space is left at the end of a theoretical filled ROM for our halt condition
    // this leads to a hard limit of 5,460 instructions
    if (bytes.length == 32760) {
      err("too many instructions");
    }

    // if a line is a label, or is empty, skip it
    if (line.match(/^[a-z_]([a-z0-9_]+)?:$|^$/)) {
      lineNo++;
      continue;
    }

    // remove mnemonic if given
    // (i like giving it, but others may not)
    if (line.slice(0, 6) == "abcout") {
      line = line.slice(6, line.length).trimStart();
    }

    let args = line.split(", ");
    let C = args[2];
    if (args.length != 3) { err("wrong number of arguments"); }

    // handling of third argument
    if (C.match(/^[a-z_]([a-z0-9_]+)?$/)) {
      if (table[C] === undefined) { err("label not found"); }
      args[2] = table[C];
    } else {
      if (C % 6 != 0) { err("invalid value for argument C"); }
    }

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
      } else if (n >= 0) {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(n);
      } else {
        err("address cannot be negative");
      }
    }

    lineNo++;
  }

  // add halt condition
  bytes += String.fromCharCode(0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF);
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
  info(`  at line ${lineNo}`);
  process.exit(1);
}

// exports
exports.assemble = assemble;
