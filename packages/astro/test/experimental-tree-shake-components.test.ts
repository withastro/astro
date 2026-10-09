import assert from 'node:assert/strict';
import fs from 'node:fs';
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

		it('keeps CSS imported by a page script', async () => {
			const html = await fixture.readFile('/page-script/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.page-script-style/, 'page script CSS should be included');
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

		it('keeps shared CSS when only one of its components renders', async () => {
			const html = await fixture.readFile('/shared/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.shared-style/, 'shared CSS should be kept because a user renders');
			assert.match(css, /\.e-from-frontmatter/, 'E frontmatter CSS should be included');
			assert.match(css, /\.comp\[[^\]]+\]\.e p/, 'E scoped style should be included');
		});

		it('keeps shared CSS when the other component renders', async () => {
			const html = await fixture.readFile('/shared-d/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.shared-style/, 'shared CSS should be kept because D renders');
			assert.match(css, /\.d-from-frontmatter/, 'D frontmatter CSS should be included');
			assert.match(css, /\.comp\[[^\]]+\]\.d p/, 'D scoped style should be included');
		});

		it('keeps a stylesheet shared by the page and an unrendered component', async () => {
			const html = await fixture.readFile('/shared-page/index.html');
			const css = await collectCss(fixture, html);
			assert.match(css, /\.shared-style/, 'page-level shared CSS should be kept');
		});

		it('keeps CSS a rendered component loads with a dynamic import', async () => {
			const files = await fixture.readdir('./_astro');
			let found = false;
			for (const file of files) {
				if (!file.endsWith('.css')) continue;
				const content = await fixture.readFile(`/_astro/${file}`);
				if (content.includes('.f-from-dynamic-script')) {
					found = true;
					break;
				}
			}
			assert.ok(found, 'dynamically imported CSS should not be pruned');
		});
	});

	describe('prerendered (static) with incremental builds', () => {
		const root = new URL('./fixtures/include-only-used-incremental/', import.meta.url);
		const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
		const ROUTE = 'src/pages/[slug].astro';

		async function build(): Promise<void> {
			const fixture = await loadFixture({
				root,
				experimental: { incrementalBuild: true },
			});
			await fixture.build();
		}

		before(async () => {
			fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
			fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
			// Build twice. The second build can skip the only page, so its
			// referenced assets must be replayed from the incremental cache or
			// pruning deletes the files its restored HTML still links.
			await build();
			await build();
		});

		it('keeps the assets a skipped page references', async () => {
			const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
			assert.ok(
				cache.routes[ROUTE]?.paths['/page']?.referencedAssets?.length,
				'the skipped path should replay its referenced assets',
			);

			const html = fs.readFileSync(new URL('dist/page/index.html', root), 'utf-8');
			const refs = [...html.matchAll(/_astro\/[^"'?]+?\.(?:js|css)/g)].map((m) => m[0]);
			assert.ok(refs.length > 0, 'the page should reference client assets');
			for (const ref of refs) {
				assert.ok(
					fs.existsSync(new URL(`dist/${ref}`, root)),
					`referenced asset should exist: ${ref}`,
				);
			}
		});

		it('prunes the script chunks of unrendered components', async () => {
			const files = fs.readdirSync(new URL('dist/_astro/', root));
			assert.ok(
				files.some((file) => file.includes('A.astro_astro_type_script')),
				'A script chunk should be kept',
			);
			assert.ok(
				!files.some((file) => file.includes('B.astro_astro_type_script')),
				'B script chunk should be pruned',
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

		it('keeps the styles of components rendered by a server island', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/island'));
			const html = await response.text();
			const $ = cheerio.load(html);
			const css = $('style').text();
			assert.match(css, /\.card-from-frontmatter/, 'island child CSS should be kept');
		});
	});
});
