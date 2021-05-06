import type { Node } from 'estree';
import { BaseNode } from '../../interfaces.js';
import { Parser } from '../index.js';
import { read_sequence } from '../state/tag.js';

const markdown_closing_tag = '</Markdown>';
const markdown_code_fence = '```';

export default function read_markdown(parser: Parser): Omit<BaseNode, 'type'> {
  const markdown_start = parser.index;
  const children = [];
  let i = 0;
  let inCodeBlock = false;
    
  while (true) {
    children.push(...read_sequence(parser, () => parser.match(markdown_closing_tag) || parser.match(markdown_code_fence)));
    if (parser.eat(markdown_code_fence)) {
      children.push({ start: parser.index, end: parser.index + 3, type: 'Text', data: markdown_code_fence })
      const start = parser.index + 3;
      const data = parser.read_until(new RegExp(markdown_code_fence));
      const end = parser.index;
      
      children.push({ start, end, type: 'Text', data });
      parser.eat(markdown_code_fence, true);
      children.push({ start: end, end: parser.index + 5, type: 'Text', data: `${markdown_code_fence}\n\n` })
      inCodeBlock = !inCodeBlock;
      continue;
    } else {
      break;
    }
  }

  parser.read(/<\/Markdown>/);

  return {
    start: markdown_start,
    end: parser.index,
    children
  };
}


/*
  const children = [];
    let i = 0;
    let inCodeBlock = false;
    
    while (true) {
      console.log(`loop ${i++}`);
      console.log(parser.template.slice(parser.index));
      children.push(...read_sequence(parser, () => parser.match('</Markdown>') || parser.match('```')));
      if (parser.eat('```')) {
        children.push({ start: parser.index, end: parser.index + 3, type: 'Text', data: '```' })
        const start = parser.index + 3;
        const data = parser.read_until(new RegExp('```'));
        const end = parser.index;
        
        children.push({ start, end, type: 'Text', data });
        parser.eat('```', true);
        children.push({ start: end, end: parser.index + 5, type: 'Text', data: '```\n\n' })
        inCodeBlock = !inCodeBlock;
        continue;
      } else {
        break;
      }
    }
    element.children = children;
    console.log(children);
    parser.read(/<\/Markdown>/);
    element.end = parser.index;
*/
