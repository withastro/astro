import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import testAdapter from '../../astro/test/test-adapter.js';
import { type Fixture, loadFixture, type RemoteDbServer, setupRemoteDb } from './test-utils.ts';

describe('missing app token', () => {
	let fixture: Fixture;
	let remoteDbServer: RemoteDbServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/no-apptoken/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});

		remoteDbServer = await setupRemoteDb(fixture.config);
		await fixture.build();
		// Ensure there's no token at runtime
		delete process.env.ASTRO_DB_APP_TOKEN;
	});

	after(async () => {
		await remoteDbServer?.stop();
	});

	it('Errors as runtime', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		try {
			await response.text();
		} catch {
			assert.equal(response.status, 501);
		}
	});
});
