import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, testIntegration } from './test-utils.js';
import { netlifyStatic } from '../../dist/index.js';
import { fileURLToPath } from 'url';

describe('SSG - Redirects', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/redirects/', import.meta.url).toString(),
			output: 'static',
			adapter: netlifyStatic(),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		let redirects = await fixture.readFile('/_redirects');
		let parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal(['/nope', '/', '301']);
	});
});
