import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

async function collectCss(fixture: Fixture, html: string): Promise<string> {
	const $ = cheerio.load(html);
	const parts: string[] = [];
	for (const el of $('link[rel=stylesheet]').toArray()) {
		const href = $(el).attr('href')!;
		parts.push(await fixture.readFile(href.replace(/^\/?/, '/')));
	}
	$('style').each((_i, el) => {
		parts.push($(el).text());
	});
	return parts.join('\n');
}

function assertOnlyBlockUsed(css: string) {
	assert.match(css, /\.block-from-frontmatter/, 'the rendered component CSS should be included');
	assert.match(css, /\.block\[[^\]]+\] p/, 'the rendered scoped style should be included');
	assert.match(css, /letter-spacing:\s*7\.7px/, 'the rendered CSS module should be included');
	assert.match(css, /letter-spacing:\s*9\.9px/, 'the rendered inline style should be included');
	assert.doesNotMatch(
		css,
		/\.other-from-frontmatter/,
		'the unrendered component CSS should be excluded',
	);
	assert.doesNotMatch(css, /\.other\[[^\]]+\] p/, 'the unrendered scoped style should be excluded');
	assert.doesNotMatch(
		css,
		/letter-spacing:\s*8\.8px/,
		'the unrendered CSS module should be excluded',
	);
	assert.doesNotMatch(
		css,
		/letter-spacing:\s*6\.6px/,
		'the unrendered inline style should be excluded',
	);
}

describe('experimental.dynamicComponents', () => {
	describe('prerendered (static)', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/include-only-used-dynamic/',
				outDir: './dist/dynamic-components-static/',
			});
			await fixture.build();
		});

		it('only includes the styles of the rendered component', async () => {
			const html = await fixture.readFile('/index.html');
			const css = await collectCss(fixture, html);
			assertOnlyBlockUsed(css);
		});

		it('keeps page-level styles', async () => {
			const html = await fixture.readFile('/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.page-only/, 'page frontmatter CSS should be included');
		});

		it('includes the styles of whichever candidate renders', async () => {
			const html = await fixture.readFile('/other/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.other-from-frontmatter/, 'the other component CSS should be included');
			assert.match(css, /\.other\[[^\]]+\] p/, 'the other scoped style should be included');
			assert.match(css, /letter-spacing:\s*8\.8px/, 'the other CSS module should be included');
			assert.match(css, /letter-spacing:\s*6\.6px/, 'the other inline style should be included');
			assert.doesNotMatch(
				css,
				/\.block-from-frontmatter/,
				'the block component CSS should be excluded',
			);
			assert.doesNotMatch(
				css,
				/letter-spacing:\s*7\.7px/,
				'the block CSS module should be excluded',
			);
			assert.doesNotMatch(
				css,
				/letter-spacing:\s*9\.9px/,
				'the block inline style should be excluded',
			);
		});

		it('only includes the scripts of the rendered component', async () => {
			const html = await fixture.readFile('/index.html');
			assert.match(
				html,
				/Block\.astro_astro_type_script/,
				'the rendered component script should be included',
			);
			assert.doesNotMatch(
				html,
				/Other\.astro_astro_type_script/,
				'the unrendered component script should be excluded',
			);

			const otherHtml = await fixture.readFile('/other/index.html');
			assert.match(
				otherHtml,
				/Other\.astro_astro_type_script/,
				'the other component script should be included',
			);
			assert.doesNotMatch(
				otherHtml,
				/Block\.astro_astro_type_script/,
				'the block component script should be excluded',
			);
		});
	});

	describe('on-demand (SSR)', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/include-only-used-dynamic-ssr/',
				adapter: testAdapter(),
				outDir: './dist/dynamic-components-ssr/',
			});
			await fixture.build();
		});

		it('only includes the styles of the rendered component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			const css = await collectCss(fixture, html);
			assertOnlyBlockUsed(css);
			assert.match(css, /\.page-only/, 'page frontmatter CSS should be included');
		});

		it('includes the styles of whichever candidate renders', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/other'));
			const html = await response.text();
			const css = await collectCss(fixture, html);
			assert.match(css, /\.other-from-frontmatter/, 'the other component CSS should be included');
			assert.match(css, /letter-spacing:\s*8\.8px/, 'the other CSS module should be included');
			assert.match(css, /letter-spacing:\s*6\.6px/, 'the other inline style should be included');
			assert.doesNotMatch(
				css,
				/\.block-from-frontmatter/,
				'the block component CSS should be excluded',
			);
			assert.doesNotMatch(
				css,
				/letter-spacing:\s*7\.7px/,
				'the block CSS module should be excluded',
			);
			assert.doesNotMatch(
				css,
				/letter-spacing:\s*9\.9px/,
				'the block inline style should be excluded',
			);
		});

		it('only includes the scripts of the rendered component', async () => {
			const app = await fixture.loadTestAdapterApp();
			const indexHtml = await (await app.render(new Request('http://example.com/'))).text();
			assert.match(indexHtml, /block script/, 'the rendered component script should be included');
			assert.doesNotMatch(
				indexHtml,
				/other script/,
				'the unrendered component script should be excluded',
			);
		});
	});
});
