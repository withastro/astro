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
						// Replace `return` with `throw` to avoid esbuild's "Top-level return" error during scanning.
						// This aligns with Astro's core compiler logic for frontmatter error handling.
						// See: packages/astro/src/vite-plugin-astro/compile.ts
						//
						// Known Limitation: Using regex /\breturn\b/ will incorrectly match
						// identifiers like `$return` or aliases like `import { return as ret }`.
						const contents = frontmatterMatch[1]
							.replace(/\breturn\s*;/g, 'throw 0;')
							.replace(/\breturn\b/g, 'throw ');

						// Append `export default {}` so that default imports of .astro files
						// (e.g. `import MyComponent from './MyComponent.astro'`) resolve correctly
						// during the dep scan. Without this, .astro files loaded in the `html`
						// namespace (when imported from .ts files) would have no default export,
						// causing esbuild to fail with "No matching export for import 'default'".
						return {
							contents: contents + '\nexport default {}',
							loader: 'ts',
						};
					}
				} catch {
					// Ignore read errors
				}

				// No frontmatter or read error, return empty with a default export
				return {
					contents: 'export default {}',
					loader: 'ts',
				};
			});
		},
	};
}
