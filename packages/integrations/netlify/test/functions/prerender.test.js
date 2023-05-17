import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';
import { after } from 'node:test';

describe('Mixed Prerendering with SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = true;
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

	after(() => {
		delete process.env.PRERENDER;
	});

	it('Wildcard 404 is sorted last', async () => {
		const redir = await fixture.readFile('/_redirects');
		const baseRouteIndex = redir.indexOf('/       /.netlify/functions/entry    200');
		const oneRouteIndex = redir.indexOf('/one    /one/index.html              200');
		const fourOhFourWildCardIndex = redir.indexOf('/*      /.netlify/functions/entry    404');

		expect(oneRouteIndex).to.not.be.equal(-1);
		expect(fourOhFourWildCardIndex).to.be.greaterThan(baseRouteIndex);
		expect(fourOhFourWildCardIndex).to.be.greaterThan(oneRouteIndex);
	});
});

describe('Mixed Hybrid rendering with SSR', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		process.env.PRERENDER = false;
		fixture = await loadFixture({
			root: new URL('./fixtures/prerender/', import.meta.url).toString(),
			output: 'hybrid',
			experimental: {
				hybridOutput: true,
			},
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/prerender/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
		});
		await fixture.build();
	});

	after(() => {
		delete process.env.PRERENDER;
	});

	it('outputs a correct redirect file', async () => {
		const redir = await fixture.readFile('/_redirects');
		const baseRouteIndex = redir.indexOf('/one    /.netlify/functions/entry    200');
		const rootRouteIndex = redir.indexOf('/       /index.html                  200');
		const fourOhFourIndex = redir.indexOf('/404    /404.html                    200');

		expect(rootRouteIndex).to.not.be.equal(-1);
		expect(baseRouteIndex).to.not.be.equal(-1);
		expect(fourOhFourIndex).to.not.be.equal(-1);
	});
});
