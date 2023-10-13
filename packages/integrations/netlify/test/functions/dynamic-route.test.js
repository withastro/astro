import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';

describe('Dynamic pages', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/dynamic-route/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/dynamic-route/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	it('Dynamic pages are included in the redirects file', async () => {
		const redir = await fixture.readFile('/_redirects');
		expect(redir).to.match(/\/products\/:id/);
	});

	it('Prerendered routes are also included using placeholder syntax', async () => {
		const redir = await fixture.readFile('/_redirects');
		expect(redir).to.include('/pets/:cat       /pets/:cat/index.html        200');
		expect(redir).to.include('/pets/:dog       /pets/:dog/index.html        200');
		expect(redir).to.include('/pets            /.netlify/functions/entry    200');
	});
});
