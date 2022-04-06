import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../../astro/test/test-utils.js';
import netlifyAdapter from '../dist/index.js';
import { fileURLToPath } from 'url';

// Asset bundling
describe('Dynamic pages', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/dynamic-route/', import.meta.url).toString(),
			experimental: {
				ssr: true,
			},
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/dynamic-route/dist/', import.meta.url)
			}),
			site: `http://example.com`,
			vite: {
				resolve: {
					alias: { 
						'@astrojs/netlify/netlify-functions.js': fileURLToPath(new URL('../dist/netlify-functions.js', import.meta.url))
					}
				}
			}
		});
		await fixture.build();
	});

	it('Dynamic pages are included in the redirects file', async () => {
		const redir = await fixture.readFile('/_redirects');
		expect(redir).to.match(/\/products\/\*/);
	});
});
