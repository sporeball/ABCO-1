/**
 * evaluate an abcout command
 * @param {object} ASTNode
 */
function abcout (ASTNode) {
  let { args } = ASTNode;
  // count args
  if (args.length < 2) {
    throw new Error(`expected at least 2 args, got ${args.length}`);
  }
  if (args.length > 3) {
    throw new Error(`expected at most 3 args, got ${args.length}`);
  }
  // get args
  args = args.map(arg => {
    switch (arg.type) {
      case 'number':
        return arg.value;
      default:
        return arg;
    }
  });
  let [A, B, C] = args;
  if (C === undefined) {
    C = global.ASM.ptr + 6; // default to the next instruction
  }
  // write each
  byteWrite(A, B, C);
  // console.log(A, B, C);
  global.ASM.ptr += 6;
}

/**
 * evaluate a macro command
 * @param {object} ASTNode
 */
function macro (ASTNode) {
}

/**
 * evaluate an AST node of type `command`
 * @param {object} ASTNode
 */
function command (ASTNode) {
  if (ASTNode.head === 'abcout') {
    return abcout(ASTNode);
  }
  return macro(ASTNode);
}

/**
 * evaluate an AST node of type `labelDefinition`
 * @param {object} ASTNode
 */
function labelDefinition (ASTNode) {
}

/**
 * evaluate an AST node of type `macroDefinition`
 * @param {object} ASTNode
 */
function macroDefinition (ASTNode) {
}

export function evaluateNode (ASTNode) {
  switch (ASTNode.type) {
    case 'command':
      return command(ASTNode);
    case 'labelDefinition':
      return labelDefinition(ASTNode);
    case 'macroDefinition':
      return macroDefinition(ASTNode);
  }
  throw new Error(
    `assembler: no evaluation rule for token of type ${ASTNode.type}`
  );
}

function byteWrite (...values) {
  for (const value of values) {
    if (value > 255) {
      global.ASM.bytes += String.fromCharCode(value >> 8); // upper 8 bits
      global.ASM.bytes += String.fromCharCode(value & 255); // lower 8 bits
    } else {
      global.ASM.bytes += String.fromCharCode(0x00);
      global.ASM.bytes += String.fromCharCode(value);
    }
  }
}
