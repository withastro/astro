import type { ErrorLocation } from './errors.js';
/** Generate a code frame from string and an error location */
export declare function codeFrame(src: string, loc: ErrorLocation): string;
