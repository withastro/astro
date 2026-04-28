import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture, type Fixture, type DevServer } from './test-utils.ts';

describe('Can handle errors that are not instanceof Error', () => {
	let fixture: Fixture;

	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/error-non-error',
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Does not crash the dev server', async () => {
		let res = await fixture.fetch('/');
		let html = await res.text();

		assert.equal(html.includes('Error'), true);
		res = await fixture.fetch('/');
		await res.text();

		assert.equal(html.includes('Error'), true);
	});
});
