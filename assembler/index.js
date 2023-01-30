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
 * generate the bytecode for an AST node of type `command`
 * @param {object} ASTNode
 */
export function genBytecode (ASTNode, macroLabels, macroParameters) {
  // console.log('node', ASTNode);
  let args = structuredClone(ASTNode.args);
  args = args.map(arg => {
    return argNodeToValue(arg, macroLabels, macroParameters);
  });
  // console.log('args:', args);
  if (ASTNode.head === 'abcout') {
    byteWrite(...args);
    if (args.length === 2) {
      byteWrite(global.ASM.ptr + 6);
    }
    global.ASM.ptr += 6;
  } else {
    const macro = global.ASM.macros[ASTNode.head];
    // console.dir(macro, { depth: null });
    for (const node of macro.contents.filter(node => node.type === 'command')) {
      genBytecode(node, macro.labels, args);
    }
  }
}

function argNodeToValue (arg, macroLabels, macroParameters) {
  if (typeof arg === 'number') {
    return arg;
  }
  if (arg.type === 'number') {
    return arg.value;
  }
  if (arg.type === 'label') {
    const value = global.ASM.labels[arg.name];
    if (value === undefined) {
      throw new Error(`assembler: undefined label ${arg.name}`);
    }
    return value;
  }
  if (arg.type === 'macroLabel') {
    if (macroLabels === undefined) {
      throw new Error(`assembler: undefined local label ${arg.name}`);
    }
    const value = macroLabels[arg.name];
    if (value === undefined) {
      throw new Error(`assembler: undefined local label ${arg.name}`);
    }
    return value + global.ASM.ptr;
  }
  if (arg.type === 'macroParameter') {
    if (macroParameters === undefined) {
      throw new Error(
        `assembler: could not get macro parameter at index ${arg.index}`
      );
    }
    const value = macroParameters[arg.index];
    if (value === undefined) {
      throw new Error(
        `assembler: could not get macro parameter at index ${arg.index}`
      );
    }
    return value;
  }
}

export function nodeLength (ASTNode) {
  switch (ASTNode.type) {
    case 'command':
      if (ASTNode.head === 'abcout') {
        return 6;
      }
      const macro = global.ASM.macros[ASTNode.head];
      if (macro === undefined) {
        throw new Error(`assembler: undefined macro ${ASTNode.head}`);
      }
      return macro.contents
        .map(nodeLength)
        .reduce((a, c) => a + c, 0);
    default:
      return 0;
  }
}

/**
 * get a value from an AST node
 * good for arguments
 * @param {object} ASTNode
 */
function valueFromASTNode (ASTNode, macro) {
  if (ASTNode.type === 'number') {
    return ASTNode.value;
  }
  if (ASTNode.type === 'label') {
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
