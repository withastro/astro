import { expect } from 'chai';
import netlifyAdapter from '../../dist/index.js';
import { loadFixture, testIntegration } from './test-utils.js';

describe('Split support', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/split-support/', import.meta.url).toString(),
			output: 'server',
			adapter: netlifyAdapter({
				dist: new URL('./fixtures/split-support/dist/', import.meta.url),
			}),
			site: `http://example.com`,
			integrations: [testIntegration()],
			build: {
				split: true,
			},
		});
		await fixture.build();
	});

	it('outputs a correct redirect file', async () => {
		const redir = await fixture.readFile('/_redirects');
		const blogRouteIndex = redir.indexOf(
			'/blog    /.netlify/functions/src/pages/entry.blog.astro     200'
		);
		const baseRouteIndex = redir.indexOf(
			'/        /.netlify/functions/src/pages/entry.index.astro    200'
		);

		expect(baseRouteIndex).to.not.be.equal(-1);
		expect(blogRouteIndex).to.not.be.equal(-1);
		expect(redir).to.matchSnapshot();
	});

	describe('Should create multiple functions', () => {
		it('for index page', async () => {
			const entryURL = new URL(
				'./fixtures/split-support/.netlify/functions-internal/src/pages/entry.index.astro.mjs',
				import.meta.url
			);
			console.debug(entryURL);
			console.debug(entryURL.toString());
			const { handler } = await import(entryURL);
			const resp = await handler({
				httpMethod: 'POST',
				headers: {},
				rawUrl: 'http://example.com/',
				body: '{}',
			});
			expect(resp.statusCode).to.equal(200);
		});
		it('for blog page', async () => {
			const { handler } = await import(
				'./fixtures/split-support/.netlify/functions-internal/src/pages/entry.blog.astro.mjs'
			);
			const resp = await handler({
				httpMethod: 'POST',
				headers: {},
				rawUrl: 'http://example.com/blog',
				body: '{}',
			});
			expect(resp.statusCode).to.equal(200);
		});
	});
});
