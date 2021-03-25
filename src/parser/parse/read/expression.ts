import { parse_expression_at } from '../acorn.js';
import { Parser } from '../index.js';
import { whitespace } from '../../utils/patterns.js';

// @ts-ignore
export default function read_expression(parser: Parser): string {
  try {
    const start = parser.index;
    let index = parse_expression_at(parser.template, parser.index);
    let num_parens = 0;

    for (let i = parser.index; i < start; i += 1) {
      if (parser.template[i] === '(') num_parens += 1;
    }

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

    return parser.template.substring(start, index);
  } catch (err) {
    parser.acorn_error(err);
  }
}