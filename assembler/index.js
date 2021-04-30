/*
  index.js
  ABCO-1 assembler
  copyright (c) 2021 sporeball
  MIT license
*/

// dependencies
const fs = require("fs");
const chalk = require("chalk");

let contents; // file contents
let final;     // final result

let lineNo = 1;
let ip = 0;
let table = {}; // symbol table (for labels)

let macros = {};

function assemble(input) {
  contents = input;
  let bytes = "";

  // strip trailing newline if present
  if (contents.slice(-2) == "\r\n") {
    contents = contents.slice(0, -2);
  }

  // initial processing
  // remove comments, reform hex literals, and trim whitespace
  // lines which only contain a comment will be reduced to the empty string
  contents = contents.replace(/;.*$/gm, "")
    .replace(/\$/gm, "0x")
    .split("\r\n")
    .map(x => x.trimStart().trimEnd());

  // validate all macros
  for (let macro of contents.join("\r\n").match(/%macro.*?%endmacro/gs) || []) {
    // yield array with macro name, parameter count, and its lines
    macro = macro.split("\r\n")
      .map((x, i) => i == 0 ? x.split(" ").slice(1) : x)
      .slice(0, -1)
      .flat();

    let indices = findIndices(`%macro ${macro[0]} ${macro[1]}`, contents);
    if (indices.length == 0) { err(`"${macro[0]}" definition malformed (check spelling?)`, false); }
    lineNo = indices[0] + 1;

    // name validation
    let name = macro[0];
    if (name == "abcout") { err("\"abcout\" cannot be used as a macro name"); }
    if (!name.match(/^[a-z_]([a-z0-9_]+)?$/)) { err("invalid macro name"); }
    if (macros[name] !== undefined) { err(`macro "${name}" already defined`); }
    if (table[name] !== undefined) { err("macro and label cannot share a name"); }

    // parameter validation
    let params = macro[1];
    if (!params.match(/^0$|^[1-9][0-9]*$/)) { err("macro parameter count missing or invalid"); }

    // add the macro to the list
    macros[name] = {
      code: [],
      calls: 0,
      params: Number(params)
    }

    // validate all of its lines
    let lines = macro.slice(2);
    for (let line of [...new Set(lines)]) {
      lineNo = findIndices(line, contents)[0];
      if (line.split(" ").filter(x => x != "")[0] == name) {
        err(`macro "${name}" cannot call itself`);
      }
      validate(line);
    }

    macros[name].code = lines;
  }

  // expand parts
  final = contents; // start with this

  // for each unique macro that is used in the code...
  for (let line of setOf(/^(?!abcout)[a-z_]([a-z0-9_]+)?[^\r\n:]*$/gm, contents)) {
    // for each index at which it appears...
    for (let index of findIndices(line, contents)) {
      lineNo = index;
      let [instruction, ...args] = line.split(" ")
        .filter(x => x != "");

      // replace it with its code
      if (macros[instruction] === undefined) { err(`macro "${instruction}" is undefined`); }
      final[index - 1] = macros[instruction].code;
      macros[instruction].calls++;
    }
  }

  // remove all macro defiinitions
  final = final.flat()
    .join("\r\n")
    .split(/%macro.*?%endmacro/gs)
    .join("")
    .split("\r\n")
    .filter(x => x != "");

  contents = contents.flat();

  // validate and set all labels
  for (let label of contents.filter(x => x.match(/^.+:$/))) {
    // label names must be unique
    let indices = findIndices(label, contents);
    if (indices.length > 1) {
      lineNo = indices[1];
      err(`label "${label.slice(0, -1)}" already in use`);
    }

    let finalIndex = final.findIndex(x => x == label);

    label = label.slice(0, -1);
    lineNo = indices[0];

    if (label == "abcout") { err("\"abcout\" cannot be used as a label name"); }
    if (!label.match(/^[a-z_]([a-z0-9_]+)?$/)) { err("invalid label name"); }
    if (macros[label] !== undefined) { err(`label and macro cannot share a name`); }

    // the label's index is determined by the number of instructions before it
    table[label] = finalIndex * 6;
    final.splice(finalIndex, 1);
  }

  // assemble the ROM
  for (let line of final) {
    // ROM size is 32K, and we have to guarantee that space is left at the end of a theoretical filled ROM for our halt condition
    // this leads to a hard limit of 5,460 instructions
    if (bytes.length == 32760) {
      err("too many instructions", false);
    }

    // remove mnemonic if given
    // (i like giving it, but others may not)
    if (line.slice(0, 6) == "abcout") {
      line = line.slice(6, line.length).trimStart();
    }

    let args = line.split(", ");
    let C = args[2];

    // if the third argument is a label...
    if (C.match(/^[a-z_]([a-z0-9_]+)?$/)) {
      if (table[C] === undefined) { err("label not found"); }
      // update it if it is found
      args[2] = table[C];
      line = args.join(", ")
    }

    validate(line);

    for (let arg of args) {
      let n = Number(arg);
      if (n > 255) {
        bytes += String.fromCharCode(n >> 8); // upper 8 bits of n
        bytes += String.fromCharCode(n & 255); // lower 8 bits of n
      } else {
        bytes += String.fromCharCode(0x00);
        bytes += String.fromCharCode(n);
      }
    }
  }

  // add halt condition
  bytes += String.fromCharCode(0x00, 0x00, 0x00, 0x00, 0x7F, 0xFF);
  // pad with null bytes until 32K
  bytes += String.fromCharCode(0x00).repeat(32768 - bytes.length);

  fs.writeFile("rom.bin", bytes, "binary", function(){});
  success("finished!")
  return;
}

/**
 * validate a line containing an instruction
 * @param {string} line
 */
function validate(line) {
  if (line.match(/^$/)) {
    lineNo++;
    return;
  }

  let instruction, args;

  // yield the above
  let split = line.split(" ").filter(x => x != "");
  // if the first element starts with a digit, an instruction was not given, so we default to abcout
  if (split[0].match(/^\d/)) {
    instruction = "abcout";
    args = split;
  } else {
    [instruction, ...args] = split;
  }

  // if splitting on commas yields a different length, one or more commas are missing
  let a = args.join("").split(",");
  if (a.length != args.length) { err("arguments should be comma-separated"); }
  args = a;

  // format validation
  if (instruction == "abcout") {
    if (args.length != 3) { err("wrong number of arguments"); }
    if (args[2] % 6 != 0) { err("invalid value for argument C"); }
  } else {
    if (macros[instruction] === undefined) { err(`macro "${instruction}" is undefined`); }
    if (args.length != macros[instruction].params) { err("wrong number of arguments"); }
  }

  // argument validation
  for (let arg of args) {
    let n = Number(arg);
    if (isNaN(n)) { err("non-numeric argument given"); }
    if (n > 32767) {
      err("argument too big");
    } else if (n < 0) {
      err("argument cannot be negative");
    }
  }
}

// utils
const log = str => { console.log(chalk.white(str)) };
const info = str => { log(chalk.cyan(str)) };
const success = str => { log(chalk.green(str)) };
const warn = str => { log(chalk.yellow(str)) };
const err = (str, line = true) => {
  log(chalk.red("error: ") + str);
  if (line == true) info(`  at line ${lineNo}`);
  process.exit(1);
};

/**
 * find all indices of a value in an array (1-indexed)
 * @param val
 * @param {Array} arr
 */
const findIndices = (val, arr) => arr.map((x, i) => x == val ? i + 1 : "").filter(x => x != "");

/**
 * return the Set of all array values matching a regular expression
 * @param {RegExp} exp
 * @param {Array} arr
 */
const setOf = (exp, arr) => [...new Set(arr.filter(x => x.match(exp)))];

// exports
exports.assemble = assemble;
