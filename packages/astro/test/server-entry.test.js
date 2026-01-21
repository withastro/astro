import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import testAdapter, { selfTestAdapter } from './test-adapter.js';
import assert from 'node:assert/strict';

describe('Server entry', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let app;

	it('should load the custom entry when using legacy entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: testAdapter(),
			build: {
				serverEntry: 'custom.mjs',
			},
		});

		await fixture.build();
		app = await fixture.loadTestAdapterApp(false, 'custom.mjs');

		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('should load the custom entry when using self entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: selfTestAdapter(),
			build: {
				serverEntry: 'custom.mjs',
			},
		});

		await fixture.build();
		app = await fixture.loadSelfAdapterApp(false, 'custom.mjs');

		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});
});
