/*
  simulator.js
  interface to ABCO-1 simulator
  copyright (c) 2021 sporeball
  MIT license
*/

const Simulator = require("./index.js");

const chalk = require("chalk");
const fs = require("fs");
const eol = require("eol");

const args = require("yeow")({
  "file": {
    type: "file",
    extensions: ".bin",
    required: true,
    missing: "a file must be passed",
    invalid: "improper file format"
  }
});

function simulator() {
  var {file} = args;
  var filename = file.slice(file.lastIndexOf("/") + 1);

  // get file contents
  try {
    var contents = fs.readFileSync(file, {encoding: "utf-8"}, function(){});
  } catch (e) {
    runnerErr("file not found");
  }

  Simulator.parse(contents);
}

runnerErr = str => {
  console.log(chalk.red("error: ") + str);
  process.exit(1);
}

simulator();
