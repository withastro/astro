import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from './test-utils.js';

// Asset bundling
describe('Returning responses', () => {
	let fixture;
	/** @type {import('./test-utils').DevServer} */
	let devServer;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/astro-response/', import.meta.url),
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
