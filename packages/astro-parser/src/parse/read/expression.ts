import type { BaseNode, Expression } from '../../interfaces';
import { Parser } from '../index.js';
import parseAstro from '../index.js';

interface ParseState {
  source: string;
  start: number;
  index: number;
  curlyCount: number;
  bracketCount: number;
  root: Expression;
}

function peek_char(state: ParseState) {
  return state.source[state.index];
}

function peek_nonwhitespace(state: ParseState) {
  let index = state.index;
  do {
    let char = state.source[index];
    if (!/\s/.test(char)) {
      return char;
    }
    index++;
  } while (index < state.source.length);
}

function next_char(state: ParseState) {
  return state.source[state.index++];
}

function in_bounds(state: ParseState) {
  return state.index < state.source.length;
}

function consume_string(state: ParseState, stringChar: string) {
  let inEscape;
  do {
    const char = next_char(state);

    if (inEscape) {
      inEscape = false;
    } else if (char === '\\') {
      inEscape = true;
    } else if (char === stringChar) {
      break;
    }
  } while (in_bounds(state));
}

function consume_multiline_comment(state: ParseState) {
  do {
    const char = next_char(state);

    if (char === '*' && peek_char(state) === '/') {
      break;
    }
  } while (in_bounds(state));
}

function consume_line_comment(state: ParseState) {
  do {
    const char = next_char(state);
    if (char === '\n') {
      break;
    }
  } while (in_bounds(state));
}

const voidElements = new Set(['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function consume_tag(state: ParseState) {
  const start = state.index - 1;
  let tagName = '';
  let inTag = false;
  let inStart = true;
  let selfClosed = false;
  let inClose = false;

  let bracketIndex = 1;
  do {
    const char = next_char(state);

    switch (char) {
      case "'":
      case '"': {
        consume_string(state, char);
        break;
      }
      case '<': {
        inTag = false;
        tagName = '';

        if (peek_nonwhitespace(state) === '/') {
          inClose = true;
          bracketIndex--;
        } else {
          inStart = true;
          bracketIndex++;
        }
        break;
      }
      case '>': {
        // An arrow function, probably
        if (!inStart && !inClose) {
          break;
        }

        bracketIndex--;

        const addExpectedBrackets =
          // Void elements don't need a closing
          !voidElements.has(tagName.toLowerCase()) &&
          // Self-closing don't need a closing
          !selfClosed &&
          // If we're in a start tag, we expect to find 2 more brackets
          !inClose;

        if (addExpectedBrackets) {
          bracketIndex += 2;
        }

        inTag = false;
        selfClosed = false;
        inStart = false;
        inClose = false;
        break;
      }
      case ' ': {
        inTag = true;
        break;
      }
      case '/': {
        if (inStart) {
          selfClosed = true;
        }
        break;
      }
      default: {
        if (!inTag) {
          tagName += char;
        }
        break;
      }
    }

    // Unclosed tags
    if (state.curlyCount <= 0) {
      break;
    }

    if (bracketIndex === 0) {
      break;
    }
  } while (in_bounds(state));

  const source = state.source.substring(start, state.index);

  const ast = parseAstro(source);
  const fragment = ast.html;

  return fragment;
}

function consume_expression(source: string, start: number): Expression {
  const expr: Expression = {
    type: 'Expression',
    start,
    end: Number.NaN,
    codeChunks: [],
    children: [],
  };

  let codeStart: number = start;

  const state: ParseState = {
    source,
    start,
    index: start,
    curlyCount: 1,
    bracketCount: 0,
    root: expr,
  };

  do {
    const char = next_char(state);

    switch (char) {
      case '{': {
        state.curlyCount++;
        break;
      }
      case '}': {
        state.curlyCount--;
        break;
      }
      case '<': {
        const chunk = source.substring(codeStart, state.index - 1);
        expr.codeChunks.push(chunk);
        const tag = consume_tag(state);
        expr.children.push(tag);
        codeStart = state.index;
        break;
      }
      case "'":
      case '"':
      case '`': {
        consume_string(state, char);
        break;
      }
      case '/': {
        switch (peek_char(state)) {
          case '/': {
            consume_line_comment(state);
            break;
          }
          case '*': {
            consume_multiline_comment(state);
            break;
          }
        }
      }
    }
  } while (in_bounds(state) && state.curlyCount > 0);

  expr.end = state.index - 1;

  if (expr.children.length || !expr.codeChunks.length) {
    expr.codeChunks.push(source.substring(codeStart, expr.end));
  }

  return expr;
}

export const parse_expression_at = (source: string, index: number): Expression => {
  const expression = consume_expression(source, index);

  return expression;
};

// @ts-ignore
export default function read_expression(parser: Parser) {
  try {
    const expression = parse_expression_at(parser.template, parser.index);
    parser.index = expression.end;
    return expression;
  } catch (err) {
    parser.acorn_error(err);
  }
}
