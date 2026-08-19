import { readFile } from 'node:fs/promises';
import type { Plugin } from 'vite';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

// Matches tokens to skip (strings, template literals, comments) OR a top-level `return`.
// The first alternative is preserved as-is; only the second is rewritten.
// Negative lookbehind `(?<!\.)` prevents matching member accesses like `gen.return()`.
const RETURN_REPLACE_RE =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<!\.)\breturn(\s*;|\b)/g;

function replaceTopLevelReturns(code: string): string {
	return code.replace(RETURN_REPLACE_RE, (_match, skip: string | undefined, tail: string) => {
		if (skip !== undefined) return skip;
		return tail.trim() === ';' ? 'throw 0;' : 'throw ';
	});
}

/**
 * A Rolldown plugin that extracts frontmatter from .astro files during
 * dependency optimization scanning. This allows Vite to discover imports
 * in the server-side frontmatter code.
 *
 * This is the Rolldown equivalent of the esbuild plugin in
 * `esbuild-plugin-astro-frontmatter.ts`, needed because Vite 8 uses Rolldown
 * for dependency optimization and ignores `optimizeDeps.esbuildOptions`.
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
				// Replace `return` with `throw` to avoid "Top-level return" errors during scanning.
				// This aligns with Astro's core compiler logic for frontmatter error handling.
				const contents = replaceTopLevelReturns(frontmatterMatch[1]);

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
