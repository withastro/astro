// @ts-nocheck

import { locate } from 'locate-character';
import get_code_frame from './get_code_frame.js';

export class CompileError extends Error {
  code: string;
  start: { line: number; column: number };
  end: { line: number; column: number };
  pos: number;
  filename: string;
  frame: string;

  toString() {
    return `${this.message} (${this.start.line}:${this.start.column})\n${this.frame}`;
  }
}

/** Throw CompileError */
export default function error(
  message: string,
  props: {
    name: string;
    code: string;
    source: string;
    filename: string;
    start: number;
    end?: number;
  }
): never {
  const err = new CompileError(message);
  err.name = props.name;

  const start = locate(props.source, props.start, { offsetLine: 1 });
  const end = locate(props.source, props.end || props.start, { offsetLine: 1 });

  err.code = props.code;
  err.start = start;
  err.end = end;
  err.pos = props.start;
  err.filename = props.filename;

  err.frame = get_code_frame(props.source, start.line - 1, start.column);

  throw err;
}
