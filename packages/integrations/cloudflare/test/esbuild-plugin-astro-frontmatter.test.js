import * as assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { astroFrontmatterScanPlugin } from '../dist/esbuild-plugin-astro-frontmatter.js';

/**
 * Build a minimal fake esbuild `build` object that captures every `onLoad`
 * call so the plugin's setup can be inspected without running esbuild.
 */
function captureOnLoadHandlers(plugin) {
	const handlers = [];
	plugin.setup({
		onLoad(options, callback) {
			handlers.push({ options, callback });
		},
	});
	return handlers;
}

describe('astroFrontmatterScanPlugin', () => {
	let tmp;

	beforeEach(() => {
		tmp = mkdtempSync(join(tmpdir(), 'astro-frontmatter-scan-'));
	});

	afterEach(() => {
		rmSync(tmp, { recursive: true, force: true });
	});

	it('only registers onLoad handlers scoped to the "file" namespace', () => {
		// Regression test for #16203: an unscoped `onLoad({ filter: /\.astro$/ })`
		// also matches the `html` namespace, where Vite resolves `.astro` files
		// when a `.ts` module default-imports them. The plugin then strips the
		// component down to its frontmatter — which has no `export default` —
		// causing `No matching export in "html:..." for import "default"` errors
		// during dependency scanning. Scoping to `file` lets Vite's built-in
		// html-type handler take over for the `html` namespace.
		const handlers = captureOnLoadHandlers(astroFrontmatterScanPlugin());

		assert.ok(handlers.length > 0, 'plugin should register at least one onLoad handler');
		for (const { options } of handlers) {
			assert.equal(
				options.namespace,
				'file',
				`onLoad handler must declare namespace: "file" (got ${JSON.stringify(options.namespace)})`,
			);
		}
	});

	it('extracts frontmatter contents from a real .astro file in the "file" namespace', async () => {
		const astroPath = join(tmp, 'Component.astro');
		writeFileSync(
			astroPath,
			`---
import { something } from 'some-package';
const value = 1;
---

<div>{value}</div>
`,
		);

		const [{ callback }] = captureOnLoadHandlers(astroFrontmatterScanPlugin());
		const result = await callback({ path: astroPath, namespace: 'file' });

		assert.equal(result.loader, 'ts');
		assert.match(result.contents, /import \{ something \} from 'some-package'/);
		assert.match(result.contents, /const value = 1/);
		assert.doesNotMatch(
			result.contents,
			/<div>/,
			'template body must not be present in the extracted frontmatter',
		);
	});

	it('returns empty contents for a .astro file with no frontmatter', async () => {
		const astroPath = join(tmp, 'NoFrontmatter.astro');
		writeFileSync(astroPath, '<div>just markup, no frontmatter</div>\n');

		const [{ callback }] = captureOnLoadHandlers(astroFrontmatterScanPlugin());
		const result = await callback({ path: astroPath, namespace: 'file' });

		assert.equal(result.loader, 'ts');
		assert.equal(result.contents, '');
	});

	it('rewrites top-level `return` statements to `throw` to avoid esbuild errors', async () => {
		const astroPath = join(tmp, 'EarlyReturn.astro');
		writeFileSync(
			astroPath,
			`---
const condition = true;
if (condition) {
  return Astro.redirect('/elsewhere');
}
---

<div>not reached</div>
`,
		);

		const [{ callback }] = captureOnLoadHandlers(astroFrontmatterScanPlugin());
		const result = await callback({ path: astroPath, namespace: 'file' });

		assert.match(result.contents, /throw\s+Astro\.redirect/);
		assert.doesNotMatch(result.contents, /\breturn\s+Astro\.redirect/);
	});
});
