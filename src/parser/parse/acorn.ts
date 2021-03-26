import type { Node } from 'acorn';
import { parseExpression } from '@babel/parser';
// import acorn from 'acorn';
// // @ts-ignore
// import jsx from 'acorn-jsx';
// const acornJsx = acorn.Parser.extend(jsx());

export const parse = (source: string): Node => {
  throw new Error('No longer used.');
  // acorn.parse(source, {
  //   sourceType: 'module',
  //   ecmaVersion: 2020,
  //   locations: true,
  // });
};

export const parse_expression_at = (source: string, index: number): number => {
  // TODO: Clean up after acorn -> @babel/parser move
  try {
    // First, try to parse the expression. Unlike acorn, @babel/parser isn't relaxed
    // enough to just stop after the first expression, so we almost always expect a
    // parser error here instead. This is expected, so handle it.
    parseExpression(source.slice(index), {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    throw new Error('Parse error.'); // Expected to fail.
  } catch (err) {
    if (err.message.startsWith('Unexpected token') && source[index + err.pos] === '}') {
      return index + err.pos;
    }
    if (err.pos) {
      err.pos = index + err.pos;
    }
    throw err;
  }
};
// acornJsx.parseExpressionAt(source, index, {
//   sourceType: 'module',
//   ecmaVersion: 2020,
//   locations: true,
// });
