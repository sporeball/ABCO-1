/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2020 sporeball
  MIT license
*/

const Assembler = require("./index.js");

const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const eol = require("eol");

function assembler() {
  var args = process.argv.slice(2);
  var file = args[0];
  var filename;

  if (file === undefined) {
    runnerErr("a file must be passed");
  }

  if (file.slice(-4) != ".txt") {
    runnerErr("improper file format");
  }

  if (file.indexOf("/") > -1) {
    filename = file.slice(file.lastIndexOf("/") + 1, file.length);
  } else {
    filename = file;
  }

  // get file contents
  try {
    var contents = fs.readFileSync(path.join(__dirname, file), {encoding: "utf-8"}, function(){});
  } catch (e) {
    runnerErr("file not found");
  }

  Assembler.assemble(contents);
}

runnerErr = str => {
  console.log(chalk.red("error: ") + str);
  process.exit(1);
}

assembler();
