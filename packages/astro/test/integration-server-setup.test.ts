import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type DevServer, type Fixture, loadFixture } from './test-utils.js';

describe('Integration server setup', () => {
	let devServer: DevServer;
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/integration-server-setup/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Adds middlewares in dev', async () => {
		const res = await fixture.fetch('/');

		assert.equal(res.headers.get('x-middleware'), 'true');
	});
});
