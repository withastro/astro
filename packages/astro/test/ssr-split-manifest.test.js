import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

describe('astro:ssr-manifest, split', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let ssrBuildEntryPoints;
	let doneBuildEntryPoints;
	let currentRoutes;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-split-manifest/',
			output: 'server',
			adapter: testAdapter({
				setEntryPoints(hookName, entries) {
					if (hookName === 'astro:build:ssr') {
						ssrBuildEntryPoints = entries;
					}
					if (hookName === 'astro:build:done') {
						doneBuildEntryPoints = entries;
					}
				},
				setRoutes(routes) {
					currentRoutes = routes;
				},
			}),
		});
		await fixture.build();
	});

	it('should be able to render a specific entry point', async () => {
		const pagePath = 'src/pages/index.astro';
		const app = await fixture.loadEntryPoint(pagePath, currentRoutes);
		const request = new Request('http://example.com/');
		const response = await app.render(request);
		const html = await response.text();

		const $ = cheerio.load(html);
		expect($('#assets').text()).to.equal('["/_astro/index.a8a337e4.css"]');
	});

	it('should receive SSR entry points, but should not exist because they are moved', async () => {
		// number of the pages inside src/
		expect(ssrBuildEntryPoints.size).to.equal(4);
		for (const fileUrl of ssrBuildEntryPoints.values()) {
			let filePath = fileURLToPath(fileUrl);
			expect(existsSync(filePath)).to.be.false;
		}
	});

	it('should receive done entry points, and they should exist because moved', async () => {
		// number of the pages inside src/
		expect(doneBuildEntryPoints.size).to.equal(4);
		for (const fileUrl of doneBuildEntryPoints.values()) {
			let filePath = fileURLToPath(fileUrl);
			expect(existsSync(filePath)).to.be.true;
		}
	});
});
