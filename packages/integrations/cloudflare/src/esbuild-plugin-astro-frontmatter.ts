import { readFile } from 'node:fs/promises';
import type { DepOptimizationConfig } from 'vite';

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
			// Scope to the "file" namespace so that .astro files resolved into the
			// "html" namespace (e.g. when a .ts file default-imports a component)
			// fall through to Vite's built-in html-type handler, which appends
			// `export default {}` and avoids "No matching export" errors.
			build.onLoad({ filter: /\.astro$/, namespace: 'file' }, async (args) => {
				try {
					const code = await readFile(args.path, 'utf-8');

					// Extract frontmatter content between --- markers
					const frontmatterMatch = FRONTMATTER_RE.exec(code);
					if (frontmatterMatch) {
						// Wrap the frontmatter in a function so `return` is valid syntax,
						// and hoist imports to module scope for the dep scanner.
						const contents = wrapFrontmatter(frontmatterMatch[1]);

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
