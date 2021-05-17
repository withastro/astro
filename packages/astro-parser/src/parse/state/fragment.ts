import tag from './tag.js';
import setup from './setup.js';
import mustache from './mustache.js';
import text from './text.js';
import codefence from './codefence.js';
import codespan from './codespan.js';
import { Parser } from '../index.js';

export default function fragment(parser: Parser) {
  if (parser.html.children.length === 0 && parser.match_regex(/^---/m)) {
    return setup;
  }

  // Fenced code blocks are pretty complex in the GFM spec
  // https://github.github.com/gfm/#fenced-code-blocks
  if (parser.match_regex(/[`~]{3,}/)) {
    return codefence;
  }
  if (parser.match_regex(/(?<!\\)`{1,2}/)) {
    return codespan;
  }

  if (parser.match('<')) {
    return tag;
  }

  if (parser.match('{')) {
    return mustache;
  }

  return text;
}
