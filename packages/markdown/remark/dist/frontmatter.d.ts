export declare function isFrontmatterValid(frontmatter: Record<string, any>): boolean;
export declare function extractFrontmatter(code: string): string | undefined;
export interface ParseFrontmatterOptions {
	/**
	 * How the frontmatter should be handled in the returned `content` string.
	 * - `preserve`: Keep the frontmatter.
	 * - `remove`: Remove the frontmatter.
	 * - `empty-with-spaces`: Replace the frontmatter with empty spaces. (preserves sourcemap line/col/offset)
	 * - `empty-with-lines`: Replace the frontmatter with empty line breaks. (preserves sourcemap line/col)
	 *
	 * @default 'remove'
	 */
	frontmatter: 'preserve' | 'remove' | 'empty-with-spaces' | 'empty-with-lines';
}
export interface ParseFrontmatterResult {
	frontmatter: Record<string, any>;
	rawFrontmatter: string;
	content: string;
}
export declare function parseFrontmatter(
	code: string,
	options?: ParseFrontmatterOptions,
): ParseFrontmatterResult;
