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

export const parse_expression_at = (source: string, index: number) => {
  // TODO: Clean up after acorn -> @babel/parser move
  try {
    parseExpression(source.slice(index), {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });
    throw new Error('Parse error.'); // Expected to fail.
  } catch (err) {
    if (!err.pos) {
      throw err;
    }
    try {
      const result = parseExpression(source.slice(index, index + err.pos), {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });
      result.start = index;
      result.end = index + err.pos;
      return result;
    } catch (err2) {
      if (err2.pos) {
        err2.pos = index + err2.pos;
      }
      throw err2;
    }
  }
};
// acornJsx.parseExpressionAt(source, index, {
//   sourceType: 'module',
//   ecmaVersion: 2020,
//   locations: true,
// });
