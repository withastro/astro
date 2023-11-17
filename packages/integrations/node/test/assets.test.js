import { expect } from 'chai';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';

describe('Assets', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/image/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			vite: {
				build: {
					assetsInlineLimit: 0,
				}
			}
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('Assets within the _astro folder should be given immutable headers', async () => {
		let response = await fixture.fetch('/text-file');
		let cacheControl = response.headers.get('cache-control');
		expect(cacheControl).to.equal(null);
		const html = await response.text();
		const $ = cheerio.load(html);

		// Fetch the asset
		const fileURL = $('a').attr('href');
		response = await fixture.fetch(fileURL);
		cacheControl = response.headers.get('cache-control');
		expect(cacheControl).to.equal('public, max-age=604800, immutable');
	});
});
