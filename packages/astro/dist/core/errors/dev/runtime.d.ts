import { type ErrorWithMetadata } from '../index.js';
export declare function getDocsForError(err: ErrorWithMetadata): string | undefined;
/**
 * Render a subset of Markdown to HTML or a CLI output
 */
export declare function renderErrorMarkdown(markdown: string, target: 'html' | 'cli'): string;
