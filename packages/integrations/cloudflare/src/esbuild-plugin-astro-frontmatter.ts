import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import type { DepOptimizationConfig } from 'vite';

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
				// Only intercept files in the default namespace. Files already in a
				// custom namespace are either already claimed or are re-entry points
				// that should not be processed again.
				if (args.namespace !== 'file' && args.namespace !== '' && args.namespace !== undefined) {
					return undefined;
				}
				const resolvedPath = isAbsolute(args.path)
					? args.path
					: resolve(args.resolveDir, args.path);
				return { path: resolvedPath, namespace: ASTRO_FRONTMATTER_NAMESPACE };
			});

			build.onLoad({ filter: /\.astro$/, namespace: ASTRO_FRONTMATTER_NAMESPACE }, async (args) => {
				try {
					const code = await readFile(args.path, 'utf-8');

					const frontmatterMatch = FRONTMATTER_RE.exec(code);
					if (frontmatterMatch) {
						const contents = replaceTopLevelReturns(frontmatterMatch[1]);
						return {
							contents: contents + '\nexport default {}',
							loader: 'ts',
							resolveDir: dirname(args.path),
						};
					}
				} catch {
					// Ignore read errors
				}

				return {
					contents: 'export default {}',
					loader: 'ts',
					resolveDir: dirname(args.path),
				};
			});
		},
	};
}
