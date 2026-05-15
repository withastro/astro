import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

const root = new URL('./fixtures/astro-get-static-paths/', import.meta.url);

describe('getStaticPaths - build calls', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
			site: 'https://mysite.dev/',
			trailingSlash: 'never',
			base: '/blog',
			outDir: './dist/astro-get-static-paths-getstaticpaths-build-calls/',
		});
		await fixture.build({});
	});

	it('Astro.url sets the current pathname', async () => {
		const html = await fixture.readFile('/food/tacos/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#url').text(), '/blog/food/tacos');
	});
});

describe('throws if an invalid Astro property is accessed', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root,
			site: 'https://mysite.dev/',
			outDir: './dist/astro-get-static-paths-throws-if-an-invalid-astro-property-is-a/',
		});
		await fixture.editFile(
			'/src/pages/food/[name].astro',
			(prev) => prev.replace('getStaticPaths() {', 'getStaticPaths() {\nAstro.getActionResult;'),
			false,
		);
	});

	after(async () => {
		fixture.resetAllFiles();
	});

	it('does not build', async () => {
		try {
			await fixture.build({});
			assert.fail();
		} catch (err) {
			assert.equal(err instanceof Error, true);
			// @ts-ignore
			assert.equal(err.title, 'Unavailable Astro global in getStaticPaths()');
		}
	});
});
