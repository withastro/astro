import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

// Asset bundling
describe('Returning responses', () => {
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-response/',
		});

		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('Works from a page', async () => {
		let response = await fixture.fetch('/not-found');
		expect(response.status).to.equal(404);
	});
});
