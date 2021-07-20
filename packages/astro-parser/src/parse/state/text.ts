// @ts-nocheck

import { decode_character_references } from '../utils/html.js';
import { Parser } from '../index.js';

export default function text(parser: Parser) {
  const start = parser.index;

  let data = '';

  const shouldContinue = () => {
    // Special case 'code' content to avoid tripping up on user code
    if (parser.current().name === 'code') {
      return !parser.match('<') && !parser.match('{');
    }
    return !parser.match('---') && !parser.match('<') && !parser.match('{') && !parser.match('`');
  };

  while (parser.index < parser.template.length && shouldContinue()) {
    data += parser.template[parser.index++];
  }

  const node = {
    start,
    end: parser.index,
    type: 'Text',
    raw: data,
    data: decode_character_references(data),
  };

  parser.current().children.push(node);
}
