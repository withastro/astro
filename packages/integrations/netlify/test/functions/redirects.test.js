import { expect } from 'chai';
import { loadFixture, testIntegration } from './test-utils.js';
import netlifyAdapter from '../../dist/index.js';

describe('SSG - Redirects', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('../static/fixtures/redirects/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('../static/fixtures/redirects/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
			redirects: {
				'/other': '/',
			},
			experimental: {
				redirects: true,
			},
		});
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		let redirects = await fixture.readFile('/_redirects');
		let parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal([
			'/other',
			'/',
			'301',
			// This uses the dynamic Astro.redirect, so we don't know that it's a redirect
			// until runtime. This is correct!
			'/nope',
			'/.netlify/functions/entry',
			'200',
			'/',
			'/.netlify/functions/entry',
			'200',

			// A real route
			'/team/articles/*',
			'/.netlify/functions/entry',
			'200',
		]);
	});
});
