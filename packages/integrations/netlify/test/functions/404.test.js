import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';

describe('404 page', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/404/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/404/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	it('404 route is included in the redirect file', async () => {
		const redir = await fixture.readFile('/_redirects');
		const expr = new RegExp("/*    /.netlify/functions/entry    404");
		expect(redir).to.match(expr);
	});
});
