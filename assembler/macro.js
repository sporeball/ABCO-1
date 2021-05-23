/*
  macro.js
  ABCO-1 assembler macro handler
  copyright (c) 2021 sporeball
  MIT license
*/

const {Exception, LineException, ...Util} = require("./util.js");

/**
 * create a macro object from a multiline string containing one
 * @param {String} macro
 */
function create(macro) {
  let definition = macro.split("\n")[0];
  let dependencies = [];

  // yield array with macro name, parameter count, and its lines
  macro = macro.split("\n")
    .map((x, i) => i == 0 ? x.split(" ").slice(1) : x)
    .slice(0, -1)
    .flat();

  let [name, params, ...lines] = macro;

  if (global.macros[name] !== undefined) {
    throw new LineException(`macro "${name}" already defined`);
  } 

  // catch circular dependence
  let idx = lines.findIndex(x => x.split(" ")[0] == name);
  if (idx != -1) {
    global.lineNo += (idx + 1);
    throw new LineException(`macro "${name}" cannot call itself`);
  }

  // validate the definition line
  validate(definition);

  // expand the macros this macro depends on
  lines = lines.flatMap(x => {
    global.lineNo++;
    if (Util.isMacro(x)) {
      let dep = x.split(" ").filter(y => y != "")[0];
      dependencies.push(dep);
      return expand(x);
    } else {
      return x;
    }
  });

  // create it
  global.macros[name] = {
    calls: 0,
    params: Number(params),
    dependencies: dependencies,
    lines: lines
  };
}

/**
 * return the expansion of a macro instruction
 * @param {Object} instruction
 * @param {boolean} [top] whether this expansion is occurring in the main code
 * @returns {Array}
 */
function expand(instruction, top = false) {
  // macro_name A, B, C, ...
  let [name, ...args] = instruction.split(" ");
  if (global.macros[name] === undefined) { throw new LineException(`macro "${name}" is undefined`); }

  args = Util.argify(args);
 
  if (top) {
    global.macros[name].calls++;
    for (let dep of global.macros[name].dependencies) {
      global.macros[dep].calls++;
    }
  }

  return global.macros[name].lines;
}

/**
 * validate the macro with the given definition line
 * @param {String} definition
 */
function validate(definition) {
  let [name, params] = definition.split(" ").slice(1);

  // name validation
  if (name == "abcout") { throw new LineException("\"abcout\" cannot be used as a macro name"); }
  if (!name.match(/^[a-z_]([a-z0-9_]+)?$/)) { throw new LineException("invalid macro name"); }
  if (global.labels[name] !== undefined) { throw new LineException("macro and label cannot share a name"); }

  // parameter validation
  if (isNaN(params)) { throw new LineException("macro parameter count missing or invalid"); }
}

module.exports = { create, expand };
