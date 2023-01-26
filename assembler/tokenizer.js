import escapeStringRegexp from 'escape-string-regexp';

const tokenTypes = {
  identifier: /^[a-z][a-z0-9_]*/,
  number: /^0|^[1-9]\d*/,
  hex: /^\$[0-9a-fA-F]+/,
  comma: ',',
  labelDefinition: /^@[a-z][a-z0-9_]*:/,
  label: /^@[a-z][a-z0-9_]*/,
  macroStart: '%macro',
  macroEnd: '%endmacro',
  macroParameter: /^%0|^%[1-9]\d*/,
  import: 'import',
  // percent: '%',
  // at: '@',
  newline: '\n',
  whitespace: /^\s+/
};

/**
 * match a string against a matcher value
 * returns undefined if there is no match
 * @param {string} value
 * @param {string|RegExp} matcher
 * @returns {string|undefined}
 */
function stringMatch (value, matcher) {
  if (typeof matcher === 'string') {
    matcher = '^' + escapeStringRegexp(matcher);
  }
  return (value.match(matcher) || [])[0];
}

export default function tokenize (input) {
  let tokens = [];
  while (input.length > 0) {
    const token = Object.entries(tokenTypes)
      .map(entry => {
        let [type, matcher] = entry;
        const match = stringMatch(input, matcher);
        if (match) {
          return {
            type,
            value: match
          };
        }
        return undefined;
      })
      .find(token => token !== undefined);
    if (token === undefined) {
      throw new Error('tokenizer: no matching token type found');
    }
    tokens.push(token);
    input = input.slice(token.value.length);
  }
  tokens = tokens.filter(token => token.type !== 'whitespace');
  return tokens;
}
