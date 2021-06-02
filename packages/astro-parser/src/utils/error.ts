// @ts-nocheck

import { locate } from 'locate-character';
import get_code_frame from './get_code_frame.js';

export class CompileError extends Error {
  code: string;
  end: { line: number; column: number };
  filename: string;
  frame: string;
  start: { line: number; column: number };

  constructor({ code, filename, start, end, message }: { code: string; filename: string; start: number; message: string; end?: number }) {
    super(message);

    this.start = locate(code, start, { offsetLine: 1 });
    this.end = locate(code, end || start, { offsetLine: 1 });
    this.filename = filename;
    this.message = message;
    this.frame = get_code_frame(code, this.start.line - 1, this.start.column);
  }

  toString() {
    return `${this.filename}:${this.start.line}:${this.start.column}\n\t${this.message}\n${this.frame}`;
  }
}

/** Throw CompileError */
export default function error(
  code: string,
  message: string,
  props: {
    name: string;
    source: string;
    filename: string;
    start: number;
    end?: number;
  }
): never {
  const err = new CompileError({ code, message, start: props.start, end: props.end, filename: props.filename });
  err.name = props.name;

  throw err;
}
