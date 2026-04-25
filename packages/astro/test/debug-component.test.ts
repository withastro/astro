import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, isMacOS, loadFixture } from './test-utils.js';

// TODO: fix this tests in macOS
if (!isMacOS) {
	describe('<Debug />', () => {
		let fixture: Fixture;
		let devServer: DevServer;

		before(async () => {
			fixture = await loadFixture({ root: './fixtures/debug-component/' });
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Works in markdown pages', async () => {
			const response = await fixture.fetch('/posts/first');
			assert.equal(response.status, 200);
		});
	});
}
