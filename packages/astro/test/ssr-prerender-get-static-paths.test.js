import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.js';

describe('Prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	describe('output: "server"', () => {
		describe('getStaticPaths - build calls', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/ssr-prerender-get-static-paths/',
					site: 'https://mysite.dev/',
					adapter: testAdapter(),
					base: '/blog',
					output: 'server',
				});
				await fixture.build();
			});

			after(async () => {
				await fixture.clean();
			});

			afterEach(() => {
				// reset the flag used by [...calledTwiceTest].astro between each test
				globalThis.isCalledOnce = false;
			});

			it('is only called once during build', () => {
				// useless expect; if build() throws in setup then this test fails
				expect(true).to.equal(true);
			});

			it('Astro.url sets the current pathname', async () => {
				const html = await fixture.readFile('/client/food/tacos/index.html');
				const $ = cheerio.load(html);

				expect($('#props').text()).to.equal('10');
				expect($('#url').text()).to.equal('/blog/food/tacos/');
			});
		});

		describe('getStaticPaths - dev calls', () => {
			let devServer;

			before(async () => {
				globalThis.isCalledOnce = false;
				devServer = await fixture.startDevServer();
			});

			afterEach(() => {
				// reset the flag used by [...calledTwiceTest].astro between each test
				globalThis.isCalledOnce = false;
			});

			after(async () => {
				devServer.stop();
			});

			it('only calls prerender getStaticPaths once', async () => {
				let res = await fixture.fetch('/blog/a');
				expect(res.status).to.equal(200);

				res = await fixture.fetch('/blog/b');
				expect(res.status).to.equal(200);

				res = await fixture.fetch('/blog/c');
				expect(res.status).to.equal(200);
			});

			describe('404 behavior', () => {
				it('resolves 200 on matching static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-sausage');
					expect(res.status).to.equal(200);
				});

				it('resolves 404 on pattern match without static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-pineapple');
					const html = await res.text();
					expect(res.status).to.equal(404);
					expect(html).to.match(/404/);
				});

				it('resolves 200 on matching static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/grimaldis/new-york');
					expect(res.status).to.equal(200);
				});

				it('resolves 404 on pattern match without static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/pizza-hut');
					const html = await res.text();

					expect(res.status).to.equal(404);
					expect(html).to.match(/404/);
				});
			});

			describe('route params type validation', () => {
				it('resolves 200 on nested array parameters', async () => {
					const res = await fixture.fetch('/blog/nested-arrays/slug1');
					expect(res.status).to.equal(200);
				});

				it('resolves 200 on matching static path - string params', async () => {
					// route provided with { params: { year: "2022", slug: "post-2" }}
					const res = await fixture.fetch('/blog/blog/2022/post-1');
					expect(res.status).to.equal(200);
				});

				it('resolves 200 on matching static path - numeric params', async () => {
					// route provided with { params: { year: 2022, slug: "post-2" }}
					const res = await fixture.fetch('/blog/blog/2022/post-2');
					expect(res.status).to.equal(200);
				});
			});

			it('resolves 200 on matching static paths', async () => {
				// routes params provided for pages /posts/1, /posts/2, and /posts/3
				for (const page of [1, 2, 3]) {
					let res = await fixture.fetch(`/blog/posts/${page}`);
					expect(res.status).to.equal(200);

					const html = await res.text();
					const $ = cheerio.load(html);

					const canonical = $('link[rel=canonical]');
					expect(canonical.attr('href')).to.equal(
						`https://mysite.dev/blog/posts/${page}`,
						`doesn't trim the /${page} route param`
					);
				}
			});
		});
	});

	describe('output: "hybrid"', () => {
		describe('getStaticPaths - build calls', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/ssr-prerender-get-static-paths/',
					site: 'https://mysite.dev/',
					adapter: testAdapter(),
					base: '/blog',
					output: 'hybrid',
					vite: {
						plugins: [vitePluginRemovePrerenderExport()],
					},
				});
				await fixture.build();
			});

			after(async () => {
				await fixture.clean();
			});

			afterEach(() => {
				// reset the flag used by [...calledTwiceTest].astro between each test
				globalThis.isCalledOnce = false;
			});

			it('is only called once during build', () => {
				// useless expect; if build() throws in setup then this test fails
				expect(true).to.equal(true);
			});

			it('Astro.url sets the current pathname', async () => {
				const html = await fixture.readFile('/client/food/tacos/index.html');
				const $ = cheerio.load(html);

				expect($('#props').text()).to.equal('10');
				expect($('#url').text()).to.equal('/blog/food/tacos/');
			});
		});

		describe('getStaticPaths - dev calls', () => {
			let devServer;

			before(async () => {
				globalThis.isCalledOnce = false;
				devServer = await fixture.startDevServer();
			});

			afterEach(() => {
				// reset the flag used by [...calledTwiceTest].astro between each test
				globalThis.isCalledOnce = false;
			});

			after(async () => {
				devServer.stop();
			});

			it('only calls hybrid getStaticPaths once', async () => {
				let res = await fixture.fetch('/blog/a');
				expect(res.status).to.equal(200);

				res = await fixture.fetch('/blog/b');
				expect(res.status).to.equal(200);

				res = await fixture.fetch('/blog/c');
				expect(res.status).to.equal(200);
			});

			describe('404 behavior', () => {
				it('resolves 200 on matching static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-sausage');
					expect(res.status).to.equal(200);
				});

				it('resolves 404 on pattern match without static path - named params', async () => {
					const res = await fixture.fetch('/blog/pizza/provolone-pineapple');
					const html = await res.text();
					expect(res.status).to.equal(404);
					expect(html).to.match(/404/);
				});

				it('resolves 200 on matching static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/grimaldis/new-york');
					expect(res.status).to.equal(200);
				});

				it('resolves 404 on pattern match without static path - rest params', async () => {
					const res = await fixture.fetch('/blog/pizza/pizza-hut');
					const html = await res.text();

					expect(res.status).to.equal(404);
					expect(html).to.match(/404/);
				});
			});

			describe('route params type validation', () => {
				it('resolves 200 on nested array parameters', async () => {
					const res = await fixture.fetch('/blog/nested-arrays/slug1');
					expect(res.status).to.equal(200);
				});

				it('resolves 200 on matching static path - string params', async () => {
					// route provided with { params: { year: "2022", slug: "post-2" }}
					const res = await fixture.fetch('/blog/blog/2022/post-1');
					expect(res.status).to.equal(200);
				});

				it('resolves 200 on matching static path - numeric params', async () => {
					// route provided with { params: { year: 2022, slug: "post-2" }}
					const res = await fixture.fetch('/blog/blog/2022/post-2');
					expect(res.status).to.equal(200);
				});
			});

			it('resolves 200 on matching static paths', async () => {
				// routes params provided for pages /posts/1, /posts/2, and /posts/3
				for (const page of [1, 2, 3]) {
					let res = await fixture.fetch(`/blog/posts/${page}`);
					expect(res.status).to.equal(200);

					const html = await res.text();
					const $ = cheerio.load(html);

					const canonical = $('link[rel=canonical]');
					expect(canonical.attr('href')).to.equal(
						`https://mysite.dev/blog/posts/${page}`,
						`doesn't trim the /${page} route param`
					);
				}
			});
		});
	});
});

/** @returns {import('vite').Plugin} */
function vitePluginRemovePrerenderExport() {
	const EXTENSIONS = ['.astro', '.ts'];
	/** @type {import('vite').Plugin} */
	const plugin = {
		name: 'remove-prerender-export',
		transform(code, id) {
			if (!EXTENSIONS.some((ext) => id.endsWith(ext))) return;
			return code.replace(/export\s+const\s+prerender\s+=\s+true;/g, '');
		},
	};
	return {
		name: 'remove-prerender-export-injector',
		configResolved(resolved) {
			resolved.plugins.unshift(plugin);
		},
	};
}
