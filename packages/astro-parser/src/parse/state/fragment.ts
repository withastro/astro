import tag from './tag.js';
import setup from './setup.js';
import mustache from './mustache.js';
import text from './text.js';
import { Parser } from '../index.js';

export default function fragment(parser: Parser) {
  if (parser.html.children.length === 0 && parser.match_regex(/^---/m)) {
    return setup;
  }

  if (parser.match('<')) {
    return tag;
  }

  if (parser.match('{')) {
    return mustache;
  }

  return text;
}
