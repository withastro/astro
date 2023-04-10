import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Integration server setup', () => {
	/** @type {import('./test-utils').DevServer} */
	let devServer;
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/integration-server-setup/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Adds middlewares in dev', async () => {
		const res = await fixture.fetch('/');

		expect(res.headers.get('x-middleware')).to.equal('true');
	});
});
