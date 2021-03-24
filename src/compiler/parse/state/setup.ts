// @ts-nocheck

import { Parser } from '../index.js';

export default function setup(parser: Parser): void {
  const start = parser.index;
  parser.index += 3;
  const content_start = parser.index;
  const setupScriptContent = parser.read_until(/^---/m);
  const content_end = parser.index;
console.log(setupScriptContent);
  parser.eat('---', true);
  const end = parser.index;

  console.log('XXX', parser.template.slice(end));
  parser.js.push({
    type: 'Script',
    context: 'setup',
    start,
    end,
    content: setupScriptContent,
    // attributes,
    // content: {
    //   start: content_start,
    //   end: content_end,
    //   styles,
    // },
  });
  return;
}
