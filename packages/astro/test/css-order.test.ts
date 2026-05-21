import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('CSS production ordering', () => {
	function getLinks(html: string): string[] {
		let $ = cheerio.load(html);
		let out: string[] = [];
		$('link[rel=stylesheet]').each((_i, el) => {
			out.push($(el).attr('href')!);
		});
		return out;
	}

	async function getLinkContent(
		fixture: Fixture,
		href: string,
	): Promise<{ href: string; css: string }> {
		const css = await fixture.readFile(href);
		return { href, css };
	}

	describe('SSG and SSR parity', () => {
		let staticHTML: string, serverHTML: string;
		let staticCSS: { href: string; css: string }[], serverCSS: { href: string; css: string }[];

		const commonConfig = Object.freeze({
			root: './fixtures/css-order/',
		});

		before(async () => {
			let fixture = await loadFixture({
				...commonConfig,
				outDir: './dist/css-order-ssg-and-ssr-parity/',
			});
			await fixture.build();
			staticHTML = await fixture.readFile('/one/index.html');
			staticCSS = await Promise.all(
				getLinks(staticHTML).map((href) => getLinkContent(fixture, href)),
			);

			fixture = await loadFixture({
				...commonConfig,
				adapter: testAdapter(),
				output: 'server',
				outDir: './dist/css-order-ssg-and-ssr-parity/',
			});
			await fixture.build();

			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/one');
			const response = await app.render(request);
			serverHTML = await response.text();
			serverCSS = await Promise.all(
				getLinks(serverHTML).map(async (href) => {
					const css = await fixture.readFile(`/client${href}`);
					return { href, css };
				}),
			);
		});

		it('is in the same order for output: server and static', async () => {
			const staticContent = staticCSS.map((o) => o.css);
			const serverContent = serverCSS.map((o) => o.css);

			assert.deepEqual(staticContent, serverContent);
		});
	});

	describe('Page vs. Shared CSS', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/css-order/',
				// test suite was authored when inlineStylesheets defaulted to never
				build: { inlineStylesheets: 'never' },
				outDir: './dist/css-order-page-vs-shared-css/',
			});
			await fixture.build();
		});

		it('Page level CSS is defined lower in the page', async () => {
			let html = await fixture.readFile('/two/index.html');

			const content = await Promise.all(
				getLinks(html).map((href) => getLinkContent(fixture, href)),
			);

			assert.equal(content.length, 3, 'there are 3 stylesheets');
			const [, sharedStyles, pageStyles] = content;

			assert.ok(/red/.exec(sharedStyles.css));
			assert.ok(/#00f/.exec(pageStyles.css));
		});

		it('CSS injected by injectScript comes first because of import order', async () => {
			let oneHtml = await fixture.readFile('/one/index.html');
			let twoHtml = await fixture.readFile('/two/index.html');
			let threeHtml = await fixture.readFile('/three/index.html');

			for (const html of [oneHtml, twoHtml, threeHtml]) {
				const content = await Promise.all(
					getLinks(html).map((href) => getLinkContent(fixture, href)),
				);

				const [first] = content;
				assert.ok(first.css.includes('green'), 'Came from the injected script');
			}
		});
	});

	describe('Changes order when transparentScriptOrder is enabled', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/css-order-layout/',
				outDir: './dist/css-order-changes-order-when-transparentscriptorde/',
				cacheDir: './node_modules/.astro-test/css-order-changes-order-when-transparentscriptorde/',
			});
			await fixture.build();
		});

		it('should compile styles in the same order as they are found', async () => {
			const html = await fixture.readFile('/transparent/index.html');

			// The component declares red background first, then yellow
			assert.match(html, /body\{background:red\}body\{background:#ff0/);
		});
	});
});
