import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths()', () => {
	let fixture;

	describe('number of build calls', () => {
		before(async () => {
			fixture = await loadFixture({
				projectRoot: './fixtures/astro-get-static-paths/',
				buildOptions: {
					site: 'https://mysite.dev/blog/',
					sitemap: false,
				},
			});
			await fixture.build();
		});
		it('is only once during build', () => {
			// useless expect; if build() throws in setup then this test fails
			expect(true).to.equal(true);
		});
	});

	describe('dynamic routes', () => {
		let fixture;
		let devServer;

		before(async () => {
			fixture = await loadFixture({ projectRoot: './fixtures/astro-get-static-paths/' });
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			devServer && devServer.stop();
		});
		describe('without spread on dynamic params', () => {
			it('resolves 200 on matching static path', async () => {
				const res = await fixture.fetch('/pizza/provolone-sausage');
				expect(res.status).to.equal(200);
			});

			it('resolves 404 on bad static path', async () => {
				const res = await fixture.fetch('/pizza/provolone-pineapple');
				expect(res.status).to.equal(404);
			});
		});

		describe('with spread on dynamic params', () => {
			it('resolves 200 on matching static path', async () => {
				const res = await fixture.fetch('/pizza/grimaldis/new-york');
				expect(res.status).to.equal(200);
			});

			it('resolves 404 on bad static path', async () => {
				const res = await fixture.fetch('/pizza/pizza-hut');
				expect(res.status).to.equal(404);
			});
		});
	});
});
