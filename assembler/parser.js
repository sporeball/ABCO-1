function parseIdentifier (tokens) {
  const identifier = tokens.shift();
  const args = [];
  // eat args
  while (true) {
    if (
      tokens[0] === undefined ||
      tokens[0]?.type === 'newline'
    ) {
      break;
    }
    args.push(eat(tokens));
    if (
      tokens[0] === undefined ||
      tokens[0]?.type === 'newline'
    ) {
      break;
    }
    if (tokens[0]?.type !== 'comma') {
      throw new Error('arguments not properly comma-separated');
    }
    tokens.shift(); // skip the comma
  }
  // assert valid arg types
  if (!args.every(arg => {
    return (
      arg.type === 'number' ||
      arg.type === 'label' ||
      arg.type === 'macroLabel' ||
      arg.type === 'macroParameter'
    );
  })) {
    throw new Error('invalid argument');
  }
  return {
    type: 'command',
    head: identifier.value,
    args
  };
}

function parseNumber (tokens) {
  const number = tokens.shift();
  return {
    type: 'number',
    value: Number(number.value)
  };
}

function parseHex (tokens) {
  const literal = tokens.shift();
  const value = parseInt(literal.value.slice(1), 16);
  return {
    type: 'number',
    value
  };
}

function parseLabel (tokens) {
  const label = tokens.shift();
  return {
    type: 'label',
    name: label.value.slice(1)
  };
}

function parseLabelDefinition (tokens) {
  const label = tokens.shift();
  return {
    type: 'labelDefinition',
    name: label.value.slice(1, -1)
  };
}

function parseMacroLabel (tokens) {
  const label = tokens.shift();
  return {
    type: 'macroLabel',
    name: label.value.slice(2)
  };
}

function parseMacroLabelDefinition (tokens) {
  const label = tokens.shift();
  return {
    type: 'macroLabelDefinition',
    name: label.value.slice(2, -1)
  };
}

function parseMacroDefinition (tokens) {
  tokens.shift(); // skip the percent sign
  // signature
  const name = tokens.shift();
  if (name?.type !== 'identifier') {
    throw new Error('invalid macro name');
  }
  const nParams = eat(tokens, 'number');
  eat(tokens, 'newline');
  // body
  let contents = [];
  while (true) {
    if (tokens[0]?.type === 'macroEnd') {
      break;
    }
    contents.push(eat(tokens));
  }
  tokens.shift(); // skip the macro end
  contents = contents.filter(token => token.type !== 'newline');
  if (!contents.every(token => {
    return (
      token.type === 'command' ||
      token.type === 'macroLabelDefinition'
    );
  })) {
    throw new Error('invalid token in macro definition');
  }
  return {
    type: 'macroDefinition',
    name: name.value,
    params: nParams.value,
    contents
  };
}

function parseMacroParameter (tokens) {
  const parameter = tokens.shift();
  return {
    type: 'macroParameter',
    index: Number(parameter.value.slice(1))
  };
}

// TODO
// function parseImport (tokens) {
// }

export default function parse (tokens) {
  let tree = [];
  while (tokens.length > 0) {
    tree.push(eat(tokens));
  }
  tree = tree.filter(node => node.type !== 'newline');
  return tree;
}

function eat (tokens, type) {
  if (type !== undefined && tokens[0].type !== type) {
    throw new Error(
      `expected token of type ${type}, got ${tokens[0].type}`
    );
  }
  switch (tokens[0].type) {
    case 'identifier':
      return parseIdentifier(tokens);
    case 'number':
      return parseNumber(tokens);
    case 'hex':
      return parseHex(tokens);
    case 'comma': // bare
      throw new Error('misplaced comma');
    case 'label':
      return parseLabel(tokens);
    case 'labelDefinition':
      return parseLabelDefinition(tokens);
    case 'macroLabel':
      return parseMacroLabel(tokens);
    case 'macroLabelDefinition':
      return parseMacroLabelDefinition(tokens);
    case 'macroStart':
      return parseMacroDefinition(tokens);
    case 'macroEnd': // bare
      throw new Error('misplaced macro end');
    case 'macroParameter':
      return parseMacroParameter(tokens);
    // case 'at':
      // return parseImport(tokens);
    case 'newline':
      return tokens.shift();
  }
  throw new Error(`parser: no matching rule found: ${tokens[0].type}`);
}
