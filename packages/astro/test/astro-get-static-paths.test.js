import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths - build calls', () => {
	before(async () => {
		const fixture = await loadFixture({
			projectRoot: './fixtures/astro-get-static-paths/',
			buildOptions: {
				site: 'https://mysite.dev/blog/',
				sitemap: false,
			},
		});
		await fixture.build();
	});
	it('is only called once during build', () => {
		// useless expect; if build() throws in setup then this test fails
		expect(true).to.equal(true);
	});
});

describe('getStaticPaths - 404 behavior', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({ projectRoot: './fixtures/astro-get-static-paths/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		devServer && devServer.stop();
	});

	it('resolves 200 on matching static path - named params', async () => {
		const res = await fixture.fetch('/pizza/provolone-sausage');
		expect(res.status).to.equal(200);
	});

	it('resolves 404 on pattern match without static path - named params', async () => {
		const res = await fixture.fetch('/pizza/provolone-pineapple');
		expect(res.status).to.equal(404);
	});

	it('resolves 200 on matching static path - rest params', async () => {
		const res = await fixture.fetch('/pizza/grimaldis/new-york');
		expect(res.status).to.equal(200);
	});

	it('resolves 404 on pattern match without static path - rest params', async () => {
		const res = await fixture.fetch('/pizza/pizza-hut');
		expect(res.status).to.equal(404);
	});
});
