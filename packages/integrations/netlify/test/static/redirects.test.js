import { expect } from 'chai';
import { loadFixture, testIntegration } from './test-utils.js';
import { netlifyStatic } from '../../dist/index.js';

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
			redirects: {
				'/other': '/',
				'/two': {
					status: 302,
					destination: '/',
				},
				'/blog/[...slug]': '/team/articles/[...slug]',
			},
		});
		await fixture.build();
	});

	it('Creates a redirects file', async () => {
		let redirects = await fixture.readFile('/_redirects');
		let parts = redirects.split(/\s+/);
		expect(parts).to.deep.equal([
			'/two',
			'/',
			'302',
			'/other',
			'/',
			'301',
			'/nope',
			'/',
			'301',

			'/blog/*',
			'/team/articles/*/index.html',
			'301',
			'/team/articles/*',
			'/team/articles/*/index.html',
			'200',
		]);
	});
});
