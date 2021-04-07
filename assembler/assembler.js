/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

const Assembler = require("./index.js");

const chalk = require("chalk");
const fs = require("fs");
const eol = require("eol");

const args = require("yeow")({
  "file": {
    type: "file",
    extensions: ".txt",
    required: true,
    missing: "a file must be passed",
    invalid: "improper file format"
  }
});

function assembler() {
  var {file} = args;
  var filename = file.slice(file.lastIndexOf("/") + 1);

  // get file contents
  // also normalizes line endings to CRLF
  try {
    var contents = eol.crlf(fs.readFileSync(file, {encoding: "utf-8"}, function(){}));
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
