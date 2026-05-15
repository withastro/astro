import type { Root } from 'hast';
type Highlighter = (
	code: string,
	language: string,
	options?: {
		meta?: string;
	},
) => Promise<Root | string>;
export declare const defaultExcludeLanguages: string[];
/**
 * A hast utility to syntax highlight code blocks with a given syntax highlighter.
 *
 * @param tree
 *   The hast tree in which to syntax highlight code blocks.
 * @param highlighter
 *   A function which receives the code and language, and returns the HTML of a syntax
 *   highlighted `<pre>` element.
 */
export declare function highlightCodeBlocks(
	tree: Root,
	highlighter: Highlighter,
	excludeLanguages?: string[],
): Promise<void>;
export {};
