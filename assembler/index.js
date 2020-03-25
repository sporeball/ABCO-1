/*
  index.js
  ABCO-1 assembler
  copyright (c) 2020 sporeball
  MIT license
*/

// dependencies
const fs = require("fs");
const chalk = require("chalk");

var line = 1;

function assemble(input) {
  var contents = input; // file contents
  var bytes = "";

  // strip trailing newline if present
  if (contents.slice(-2) == "\r\n") {
    contents = contents.slice(0, -2);
  }

  contents = contents.split("\r\n");

  for (var i in contents) {
    let str = contents[i];
    if (str.slice(0, 6) != "abcout") {
      err("wrong mnemonic");
    }

    let nums = str.slice(7, str.length).split(", ");
    if (nums.length != 3) {
      err("bad instruction format");
    }

    for (var j in nums) {
      let n;
      if (nums[j].slice(0, 1) == "$") {
        n = Number("0x" + nums[j].slice(1));
      } else {
        n = Number(nums[j]);
      }

      if (isNaN(n)) { err("not a number"); }

      if (n > 32767) {
        err("address too big");
      }
      else if (n > 255) {
        bytes += String.fromCharCode(n >> 8); // upper 8 bits of n
        bytes += String.fromCharCode(n & 255); // lower 8 bits of n
      } else {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(n);
      }
    }

    line++;
  }

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
  info(`  at line ${line}`);
  process.exit(1);
}

// exports
exports.assemble = assemble;
