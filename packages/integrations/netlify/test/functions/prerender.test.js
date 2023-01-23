import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';

describe('Mixed Prerendering with SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/prerender/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});
	it('Wildcard 404 is sorted last', async () => {
		const redir = await fixture.readFile('/_redirects');
		const baseRouteIndex = redir.indexOf('/       /.netlify/functions/entry    200');
		const oneRouteIndex = redir.indexOf('/one    /one/index.html              200');
		const fourOhFourWildCardIndex = redir.indexOf('/*      /.netlify/functions/entry    404');

		expect(fourOhFourWildCardIndex).to.be.greaterThan(baseRouteIndex);
		expect(fourOhFourWildCardIndex).to.be.greaterThan(oneRouteIndex);
	});
});
