import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import type { Plugin } from 'vite';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Prerender', () => {
	let fixture: Fixture;
	describe('output: "server"', () => {
		describe('getStaticPaths - build calls', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/ssr-prerender-get-static-paths/',
					site: 'https://mysite.dev/',
					adapter: testAdapter(),
					base: '/blog',
					output: 'server',
					outDir: './dist/ssr-prerender-get-static-paths-getstaticpaths-build-calls/',
				});
				await fixture.build();
			});

			after(async () => {
				await fixture.clean();
			});

			afterEach(() => {
				// reset the flag used by [...calledTwiceTest].astro between each test
				(globalThis as any).isCalledOnce = false;
			});

			it('is only called once during build', () => {
				// useless expect; if build() throws in setup then this test fails
				assert.equal(true, true);
			});

			it('Astro.url sets the current pathname', async () => {
				const html = await fixture.readFile('/client/food/tacos/index.html');
				const $ = cheerio.load(html);

				assert.equal($('#props').text(), '10');
				assert.equal($('#url').text(), '/blog/food/tacos/');
			});
		});
	});

	describe('output: "static" with server output', () => {
		describe('getStaticPaths - build calls', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/ssr-prerender-get-static-paths/',
					site: 'https://mysite.dev/',
					adapter: testAdapter(),
					base: '/blog',
					output: 'static',
					vite: {
						plugins: [vitePluginRemovePrerenderExport()],
					},
					outDir: './dist/ssr-prerender-get-static-paths-getstaticpaths-build-calls/',
				});
				await fixture.build();
			});

			after(async () => {
				await fixture.clean();
			});

			afterEach(() => {
				// reset the flag used by [...calledTwiceTest].astro between each test
				(globalThis as any).isCalledOnce = false;
			});

			it('is only called once during build', () => {
				// useless expect; if build() throws in setup then this test fails
				assert.equal(true, true);
			});

			it('Astro.url sets the current pathname', async () => {
				const html = await fixture.readFile('/client/food/tacos/index.html');
				const $ = cheerio.load(html);

				assert.equal($('#props').text(), '10');
				assert.equal($('#url').text(), '/blog/food/tacos/');
			});
		});
	});
});

function vitePluginRemovePrerenderExport(): Plugin {
	const EXTENSIONS = ['.astro', '.ts'];
	const plugin: Plugin = {
		name: 'remove-prerender-export',
		transform(code, id) {
			if (!EXTENSIONS.some((ext) => id.endsWith(ext))) return;
			return code.replace(/export\s+const\s+prerender\s+=\s+true;/g, '');
		},
	};
	return {
		name: 'remove-prerender-export-injector',
		configResolved(resolved) {
			// @ts-expect-error: `resolved.plugins` is typed as `ReadonlyArray<Plugin>`
			resolved.plugins.unshift(plugin);
		},
	};
}
