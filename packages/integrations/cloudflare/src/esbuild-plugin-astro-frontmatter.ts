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
						// Return the frontmatter as TypeScript for import scanning
						return {
							contents: frontmatterMatch[1],
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
