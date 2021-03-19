import tag from './tag.js';
import mustache from './mustache.js';
import text from './text.js';
import { Parser } from '../index.js';

export default function fragment(parser: Parser) {
  if (parser.match('<')) {
    return tag;
  }

  if (parser.match('{')) {
    return mustache;
  }

  return text;
}
