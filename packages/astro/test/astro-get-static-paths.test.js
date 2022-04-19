import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('getStaticPaths - build calls', () => {
	before(async () => {
		const fixture = await loadFixture({
			root: './fixtures/astro-get-static-paths/',
			site: 'https://mysite.dev/',
			base: '/blog',
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
		fixture = await loadFixture({ root: './fixtures/astro-get-static-paths/' });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		devServer.stop();
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

describe('getStaticPaths - route params type validation', () => {
	let fixture;
	let devServer;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/astro-get-static-paths/' });
		devServer = await fixture.startDevServer();
	});

	it('resolves 200 on mathcing static path - string params', async () => {
		// route provided with { params: { year: "2022", slug: "post-2" }}
		const res = await fixture.fetch('/blog/2022/post-1');
		expect(res.status).to.equal(200);
	});

	it('resolves 200 on matching static path - numeric params', async () => {
		// route provided with { params: { year: 2022, slug: "post-2" }}
		const res = await fixture.fetch('/blog/2022/post-2');
		expect(res.status).to.equal(200);
	});
});
