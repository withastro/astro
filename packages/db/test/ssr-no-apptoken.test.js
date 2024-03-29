import { expect } from 'chai';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';
import { setupRemoteDbServer } from './test-utils.js';

describe('missing app token', () => {
	let fixture;
	let remoteDbServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/no-apptoken/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});

		remoteDbServer = await setupRemoteDbServer(fixture.config);
		await fixture.build();
		// Ensure there's no token at runtime
		delete process.env.ASTRO_STUDIO_APP_TOKEN;
	});

	after(async () => {
		await remoteDbServer?.stop();
	});

	it('Errors as runtime', async () => {
		const app = await fixture.loadTestAdapterApp();
		const request = new Request('http://example.com/');
		try {
			const response = await app.render(request);
			await response.text();
		} catch {
			expect(response.status).to.equal(501);
		}
	});
});
