// @ts-nocheck

import type { Node } from 'estree';
import { Parser } from '../index.js';
import { Script } from '../../interfaces.js';


const script_closing_tag = '</script>';

function get_context(parser: Parser, attributes: any[], start: number): 'runtime' | 'setup' {
  const context = attributes.find((attribute) => attribute.name === 'astro');
  if (!context) return 'runtime';
  if (context.value === true) return 'setup';

  if (context.value.length !== 1 || context.value[0].type !== 'Text') {
    parser.error(
      {
        code: 'invalid-script',
        message: 'astro attribute must be static',
      },
      start
    );
  }

  const value = context.value[0].data;

  if (value !== 'setup') {
    parser.error(
      {
        code: 'invalid-script',
        message: 'If the "astro" attribute has a value, its value must be "setup"',
      },
      context.start
    );
  }

  return value;
}

export default function read_script(parser: Parser, start: number, attributes: Node[]): Script {
  const script_start = parser.index;
  const script_end = parser.template.indexOf(script_closing_tag, script_start);

  if (script_end === -1) {
    parser.error({
      code: 'unclosed-script',
      message: '<script> must have a closing tag',
    });
  }

  const source = parser.template.slice(0, script_start).replace(/[^\n]/g, ' ') + parser.template.slice(script_start, script_end);
  parser.index = script_end + script_closing_tag.length;

  return {
    type: 'Script',
    start,
    end: parser.index,
    context: get_context(parser, attributes, start),
    content: source,
  };
}
