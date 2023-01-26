function parseIdentifier (tokens) {
  const identifier = tokens.shift();
  if (tokens[0].type === 'colon') {
    tokens.shift(); // skip
    return {
      type: 'label',
      value: identifier.value
    };
  }
  const args = [];
  while (true) {
    if (tokens[0]?.type === 'newline') {
      break;
    }
    args.push(eat(tokens));
    if (tokens[0]?.type === 'newline') {
      break;
    }
    if (tokens[0]?.type !== 'comma') {
      throw new Error('arguments not properly comma-separated');
    }
    tokens.shift(); // skip the comma
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
  const value = parseInt(literal.slice(1), 16);
  return {
    type: 'number',
    value
  };
}

function parseLabel (tokens) {
  tokens.shift(); // skip the colon
  const name = tokens.shift();
  if (name?.type !== 'identifier') {
    throw new Error('invalid label name');
  }
  return {
    type: 'label',
    name: name.value
  };
}

function parseMacroDefinition (tokens) {
  tokens.shift(); // skip the percent sign
  const name = tokens.shift();
  if (name?.type !== 'identifier') {
    throw new Error('invalid macro name');
  }
  const nParams = eat(tokens, 'number');
  let contents = [];
  eat(tokens, 'newline');
  while (true) {
    if (tokens[0]?.type === 'macroEnd') {
      break;
    }
    contents.push(eat(tokens));
  }
  tokens.shift(); // skip the macro end
  contents = contents.filter(token => token.type !== 'newline');
  if (!contents.every(token => token.type === 'command')) {
    throw new Error('invalid token in macro definition');
  }
  return {
    type: 'macroDefinition',
    params: nParams.value,
    contents
  };
}

function parseImport (tokens) {
  // TODO
}

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
    case 'colon':
      return parseLabel(tokens);
    case 'macroStart':
      return parseMacroDefinition(tokens);
    case 'macroEnd': // bare
      throw new Error('misplaced macro end');
    case 'macroParameter':
      return tokens.shift();
    // case 'at':
      // return parseImport(tokens);
    case 'newline':
      return tokens.shift();
  }
  throw new Error(`parser: no matching rule found: ${tokens[0].type}`);
}
