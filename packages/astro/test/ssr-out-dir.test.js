import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.js';
import { loadFixture } from './test-utils.js';

describe('The build', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	/** @type {import('./test-utils.js').App} */
	let app;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-locals/',
			output: 'server',
			adapter: testAdapter(),
			outDir: 'custom-dir',
		});
		await fixture.build();
		app = await fixture.loadTestAdapterApp();
	});

	it('should output the files in `custom-dir`', async () => {
		try {
			await fixture.readFile('/server/entry.mjs');
			assert.ok(true);
		} catch (e) {
			assert.fail(e);
		}
	});
});
