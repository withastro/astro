import { readFile } from 'node:fs/promises';
import type { DepOptimizationConfig } from 'vite';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

// Not exposed as a type from Vite, so need to grab this way.
type ESBuildPlugin = NonNullable<
	NonNullable<DepOptimizationConfig['esbuildOptions']>['plugins']
>[0];

/**
 * An esbuild plugin that extracts frontmatter from .astro files during
 * dependency optimization scanning. This allows Vite to discover imports
 * in the server-side frontmatter code.
 */
export function astroFrontmatterScanPlugin(): ESBuildPlugin {
	return {
		name: 'astro-frontmatter-scan',
		setup(build) {
			build.onLoad({ filter: /\.astro$/ }, async (args) => {
				try {
					const code = await readFile(args.path, 'utf-8');

					// Extract frontmatter content between --- markers
					const frontmatterMatch = FRONTMATTER_RE.exec(code);
					if (frontmatterMatch) {
						// Strip `return` statements from the frontmatter. In Astro, frontmatter
						// runs inside a function scope where `return` is valid (e.g. for
						// `return Astro.redirect(...)`), but esbuild treats files with imports
						// as ESM where top-level `return` is a syntax error. Since this plugin
						// only needs the code for import scanning, removing `return` is safe.
						// We replace with spaces to preserve source positions.
						const contents = frontmatterMatch[1].replace(/\breturn\b/g, '      ');
						return {
							contents,
							loader: 'ts',
						};
					}
				} catch {
					// Ignore read errors
				}

				// No frontmatter or read error, return empty
				return {
					contents: '',
					loader: 'ts',
				};
			});
		},
	};
}
