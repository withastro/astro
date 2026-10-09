import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

/**
 * Collects the CSS text a page actually references: the contents of every
 * external stylesheet it links plus every inline `<style>`.
 */
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

function assertOnlyAUsed(css: string) {
	assert.match(css, /\.a-from-frontmatter/, 'A frontmatter CSS should be included');
	assert.match(css, /\.comp\[[^\]]+\]\.a p/, 'A scoped style should be included');
	assert.match(css, /\.a-from-script/, 'A script CSS should be included');
	assert.doesNotMatch(css, /\.b-from-frontmatter/, 'B frontmatter CSS should be excluded');
	assert.doesNotMatch(css, /\.c-from-frontmatter/, 'C frontmatter CSS should be excluded');
	assert.doesNotMatch(css, /\.b-from-script/, 'B script CSS should be excluded');
	assert.doesNotMatch(css, /\.c-from-script/, 'C script CSS should be excluded');
}

describe('experimental.treeShakeComponents', () => {
	describe('prerendered (static)', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/include-only-used/',
				outDir: './dist/tree-shake-components-static/',
			});
			await fixture.build();
		});

		it('only includes the styles of rendered components', async () => {
			const html = await fixture.readFile('/index.html');
			const css = await collectCss(fixture, html);
			assertOnlyAUsed(css);
		});

		it('keeps page-level styles', async () => {
			const html = await fixture.readFile('/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.page-only/, 'page frontmatter CSS should be included');
		});

		it('prunes the script chunks of unrendered components', async () => {
			const files = await fixture.readdir('./_astro');
			assert.ok(
				files.some((file) => file.includes('A.astro_astro_type_script')),
				'A script chunk should be kept',
			);
			assert.ok(
				!files.some((file) => file.includes('B.astro_astro_type_script')),
				'B script chunk should be pruned',
			);
			assert.ok(
				!files.some((file) => file.includes('C.astro_astro_type_script')),
				'C script chunk should be pruned',
			);
		});
	});

	describe('on-demand (SSR)', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/include-only-used-ssr/',
				adapter: testAdapter(),
				outDir: './dist/tree-shake-components-ssr/',
			});
			await fixture.build();
		});

		it('only includes the styles of rendered components', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/'));
			const html = await response.text();
			const $ = cheerio.load(html);
			const css = $('style').text();
			assertOnlyAUsed(css);
			assert.match(css, /\.page-only/, 'page frontmatter CSS should be included');
		});
	});
});
