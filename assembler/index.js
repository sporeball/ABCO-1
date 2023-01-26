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
  args = args.map(valueFromASTNode);
  let [A, B, C] = args;
  // if the C argument is undefined, default to the address of the next
  // instruction
  if (C === undefined) {
    C = global.ASM.ptr + 6;
  }
  // C argument should point to the beginning of an instruction
  if (C % 6 !== 0) {
    throw new Error('assembler: invalid branch value');
  }
  // write each
  byteWrite(A, B, C);
  // point to the next instruction
  global.ASM.ptr += 6;
}

/**
 * evaluate a macro command
 * @param {object} ASTNode
 */
function macro (ASTNode) {
}

/**
 * evaluate a top-level AST node of type `command`
 * @param {object} ASTNode
 */
function command (ASTNode) {
  if (ASTNode.head === 'abcout') {
    return abcout(ASTNode);
  }
  return macro(ASTNode);
}

/**
 * evaluate a top-level AST node of type `labelDefinition`
 * @param {object} ASTNode
 */
function labelDefinition (ASTNode) {
  const { name } = ASTNode;
  // check that label is undefined
  if (global.ASM.labels[name] !== undefined) {
    throw new Error(`assembler: label ${name} already defined`);
  }
  // set
  global.ASM.labels[name] = global.ASM.ptr;
}

/**
 * evaluate a top-level AST node of type `macroDefinition`
 * @param {object} ASTNode
 */
function macroDefinition (ASTNode) {
}

/**
 * evaluate an AST node
 * @param {object} ASTNode
 */
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

/**
 * get a value from an AST node
 * good for arguments
 * @param {object} ASTNode
 */
function valueFromASTNode (ASTNode) {
  if (ASTNode.type === 'number') {
    return ASTNode.value;
  }
  if (ASTNode.type === 'label') {
    const labelPtr = global.ASM.labels[ASTNode.name];
    if (labelPtr === undefined) {
      throw new Error(`assembler: undefined label ${ASTNode.name}`);
    }
    return labelPtr;
  }
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
