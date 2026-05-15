import { type ErrorWithMetadata } from '../errors.js';
/**
 * Takes any error-like object and returns a standardized Error + metadata object.
 * Useful for consistent reporting regardless of where the error surfaced from.
 */
export declare function collectErrorMetadata(e: any, rootFolder?: URL): ErrorWithMetadata;
/**
 * Render a subset of Markdown to HTML or a CLI output
 */
export declare function renderErrorMarkdown(markdown: string, target: 'html' | 'cli'): string;
