// @ts-nocheck

import { parse_expression_at } from '../acorn.js';
import { Parser } from '../index.js';
import { whitespace } from '../../utils/patterns.js';
// import { Node } from 'estree';

export default function read_expression(parser: Parser): string {
  try {
    const node = parse_expression_at(parser.template, parser.index);
    let num_parens = 0;

    for (let i = parser.index; i < node.start; i += 1) {
      if (parser.template[i] === '(') num_parens += 1;
    }

    let index = node.end;
    while (num_parens > 0) {
      const char = parser.template[index];

      if (char === ')') {
        num_parens -= 1;
      } else if (!whitespace.test(char)) {
        parser.error(
          {
            code: 'unexpected-token',
            message: 'Expected )',
          },
          index
        );
      }

      index += 1;
    }

    parser.index = index;

    return parser.template.substring(node.start, node.end);
    // return node as Node;
  } catch (err) {
    parser.acorn_error(err);
  }
}
