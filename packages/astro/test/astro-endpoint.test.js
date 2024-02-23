import { before, it, after, describe } from 'node:test';
import { loadFixture } from './test-utils.js';
import assert from 'node:assert/strict';

describe('Endpoint in dev, with trailing slash set to always', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-endpoint/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('should render without issues', async () => {
		let result = await fixture.fetch('/file.json');

		assert.equal(result.status, 200);
	});
});
