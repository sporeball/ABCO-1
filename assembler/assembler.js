/*
  assembler.js
  interface to ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

const Assembler = require("./index.js");
const {Exception, LineException, ...Util} = require("./util.js");

const chalk = require("chalk");
const fs = require("fs");
const eol = require("eol");

const args = require("yeow")({
  "file": {
    type: "file",
    extensions: ".abcout",
    required: true,
    missing: "a file must be passed",
    invalid: "improper file format"
  },
  "out": {
    type: "file",
    extensions: ".bin",
    aliases: "-o / --out",
    default: "rom.bin",
    invalid: "improper file format"
  }
});

let contents;

function assembler() {
  var {file} = args;
  var filename = file.slice(file.lastIndexOf("/") + 1);

  // get file contents
  // also normalizes line endings to CRLF
  try {
    contents = eol.lf(fs.readFileSync(file, {encoding: "utf-8"}, function(){}));
  } catch (e) {
    throw new Exception("file not found");
  }

  try {
    Assembler.assemble(contents, args);
  } catch (e) {
    console.log(e.message);
  }
}

assembler();
