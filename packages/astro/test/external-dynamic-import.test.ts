import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17265
//
// A `<script>` containing an *external* dynamic import (a module Rolldown does
// not bundle, e.g. `import('/external.js')`) used to be inlined into the HTML
// with an unreplaced `__VITE_PRELOAD__` marker, causing a runtime
// `ReferenceError`. Rolldown omits external modules from `chunk.dynamicImports`
// (unlike Rollup), so the chunk wrongly looked inlineable and was deleted
// before Vite's import-analysis pass could replace the marker.
describe('External dynamic import in <script>', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/external-dynamic-import/',
			outDir: './dist/external-dynamic-import/',
			vite: {
				build: {
					// Mark the dynamic import target as external so Rolldown keeps it
					// unbundled — reproducing the `dynamicImports.length === 0` case.
					rolldownOptions: {
						external: ['/external.js'],
					},
				},
			},
		});
		await fixture.build();
	});

	async function collectOutput() {
		let combined = await fixture.readFile('/index.html');
		let assets: string[] = [];
		try {
			assets = await fixture.readdir('/_astro');
		} catch {
			// No `_astro` directory emitted (e.g. everything was inlined).
		}
		for (const file of assets) {
			if (file.endsWith('.js')) {
				combined += await fixture.readFile(`/_astro/${file}`);
			}
		}
		return combined;
	}

	it('does not leave a raw __VITE_PRELOAD__ marker in the output', async () => {
		const output = await collectOutput();
		assert.doesNotMatch(
			output,
			/__VITE_PRELOAD__/,
			'Built output should not contain an unreplaced __VITE_PRELOAD__ marker',
		);
	});

	it('preserves the external dynamic import', async () => {
		const output = await collectOutput();
		assert.match(
			output,
			/import\(\s*["'`]\/external\.js["'`]\s*\)/,
			'The external dynamic import should survive in the built output',
		);
	});
});
