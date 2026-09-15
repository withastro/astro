import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

// Matches static import declarations (single-line and multiline).
// Used to hoist imports to module scope when wrapping frontmatter in a function.
const IMPORT_STMT_RE = /^\s*import\b[\s\S]*?(?:from\s+['"][^'"]*['"]|['"][^'"]*['"]);?\s*$/gm;

/**
 * Wraps frontmatter code in an async function so that top-level `return`
 * statements are valid syntax for the bundler's parser. Static import
 * declarations are hoisted above the function since they must remain at
 * module scope for the dep scanner to discover them.
 */
export function wrapFrontmatter(code: string): string {
	const imports: string[] = [];
	const body = code.replace(IMPORT_STMT_RE, (match) => {
		imports.push(match.trim());
		return '';
	});
	return (
		imports.join('\n') +
		(imports.length ? '\n' : '') +
		'async function __astro__() {\n' +
		body +
		'\n}'
	);
}

/**
 * A Rolldown plugin that extracts frontmatter from .astro files during
 * dependency optimization scanning. This allows Vite to discover imports
 * in the server-side frontmatter code.
 */
export function rolldownAstroFrontmatterScanPlugin(): Plugin {
	return {
		name: 'astro-frontmatter-scan',
		async load(id) {
			if (!id.endsWith('.astro')) return;

			let code: string;
			try {
				code = await readFile(id, 'utf-8');
			} catch {
				// Ignore read errors, return empty with a default export
				return { code: 'export default {}', moduleType: 'ts' };
			}

			// Extract frontmatter content between --- markers
			const frontmatterMatch = FRONTMATTER_RE.exec(code);
			if (frontmatterMatch) {
				// Wrap the frontmatter in a function so `return` is valid syntax,
				// and hoist imports to module scope for the dep scanner.
				const contents = wrapFrontmatter(frontmatterMatch[1]);

				// Append `export default {}` so that default imports of .astro files
				// resolve correctly during the dep scan.
				return {
					code: contents + '\nexport default {}',
					moduleType: 'ts',
				};
			}

			// No frontmatter, return empty with a default export
			return { code: 'export default {}', moduleType: 'ts' };
		},
	};
}
