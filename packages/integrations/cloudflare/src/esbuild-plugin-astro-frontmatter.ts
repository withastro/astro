import { dirname, isAbsolute, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { DepOptimizationConfig } from 'vite';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

const ASTRO_FRONTMATTER_NAMESPACE = 'astro-frontmatter';

// Not exposed as a type from Vite, so need to grab this way.
type ESBuildPlugin = NonNullable<
	NonNullable<DepOptimizationConfig['esbuildOptions']>['plugins']
>[0];

/**
 * An esbuild plugin that extracts frontmatter from .astro files during
 * dependency optimization scanning. This allows Vite to discover imports
 * in the server-side frontmatter code.
 *
 * This plugin uses an `onResolve` handler to intercept `.astro` files before
 * Vite's built-in `vite:dep-scan` plugin routes them to the `html` namespace.
 * Without this, Vite's scanner only extracts `<script>` tags from `.astro`
 * files, completely missing frontmatter imports (which is where SSR-side
 * dependencies like `zod`, `nanostores`, `astro:transitions`, etc. live).
 */
export function astroFrontmatterScanPlugin(): ESBuildPlugin {
	return {
		name: 'astro-frontmatter-scan',
		setup(build) {
			// Intercept .astro file resolution to route them through our namespace
			// before Vite's `vite:dep-scan` plugin puts them in the `html` namespace.
			// In esbuild, plugins are processed in order and the first `onResolve`
			// match wins. Since user plugins (including this one) are registered before
			// Vite's scanner plugin, this handler takes priority.
			build.onResolve({ filter: /\.astro$/ }, (args) => {
				// Only intercept files resolved from the `file` namespace (default)
				// or empty namespace (entry points). Don't intercept files already
				// in a custom namespace to avoid infinite loops.
				if (args.namespace === 'file' || args.namespace === '' || args.namespace === undefined) {
					// Resolve relative paths to absolute using the resolveDir from esbuild
					const resolvedPath = isAbsolute(args.path)
						? args.path
						: resolve(args.resolveDir, args.path);
					return {
						path: resolvedPath,
						namespace: ASTRO_FRONTMATTER_NAMESPACE,
					};
				}
			});

			build.onLoad({ filter: /\.astro$/, namespace: ASTRO_FRONTMATTER_NAMESPACE }, async (args) => {
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

						return {
							contents: contents + '\nexport default {};',
							loader: 'ts',
							// resolveDir is required so esbuild knows where to resolve
							// imports found in the frontmatter contents.
							resolveDir: dirname(args.path),
						};
					}
				} catch {
					// Ignore read errors
				}

				// No frontmatter or read error, return empty with default export
				// so that default imports of .astro files resolve correctly
				return {
					contents: 'export default {};',
					loader: 'ts',
					resolveDir: dirname(args.path),
				};
			});
		},
	};
}
