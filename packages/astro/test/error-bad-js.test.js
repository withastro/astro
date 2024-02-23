import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Errors in JavaScript', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/error-bad-js',
			vite: {
				logLevel: 'silent',
			},
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Does not crash the dev server', async () => {
		let res = await fixture.fetch('/');
		let html = await res.text();

		assert.equal(html.includes('ReferenceError'), true);

		res = await fixture.fetch('/');
		await res.text();

		assert.equal(html.includes('ReferenceError'), true);
	});
});
