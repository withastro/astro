import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';

describe('satteri/index.js lazy imports', () => {
	// The `satteri/index.js` module must not contain static (top-level) imports
	// from `@astrojs/markdown-satteri` or `satteri`, which are optional peer
	// deps. Rolldown (Vite 8) follows dynamic imports eagerly and errors on
	// missing named exports from optional-peer-dep stubs, so these imports must
	// stay lazy (dynamic `import()` calls inside function bodies).
	it('does not statically import from optional peer deps', () => {
		const code = fs.readFileSync(new URL('../../dist/satteri/index.js', import.meta.url), 'utf-8');

		// Static imports appear at the top of the file before any function body.
		// Dynamic imports use `import("...")` or `import('...')` syntax.
		// We check that the only occurrences of these specifiers are inside
		// dynamic import() calls, not top-level `import ... from` statements.
		const staticImportRe =
			/^import\s+(?:\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+["'](?:@astrojs\/markdown-satteri|satteri)["']/m;
		assert.equal(
			staticImportRe.test(code),
			false,
			'satteri/index.js must not statically import from @astrojs/markdown-satteri or satteri. ' +
				'Use dynamic import() instead to avoid Rolldown errors when these optional peer deps are not installed.',
		);
	});

	it('does not statically import vite-plugin-mdx from the main entry', () => {
		const code = fs.readFileSync(new URL('../../dist/index.js', import.meta.url), 'utf-8');

		const staticImportRe =
			/^import\s+(?:\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+["']\.\/vite-plugin-mdx(?:\.js)?["']/m;
		assert.equal(
			staticImportRe.test(code),
			false,
			'index.js must not statically import vite-plugin-mdx.js. ' +
				'Use dynamic import() instead so that importing getContainerRenderer from @astrojs/mdx ' +
				'does not pull the satteri optional peer dep chain into the Rolldown bundle.',
		);
	});
});
