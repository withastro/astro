import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('getStaticPaths() params with special characters', () => {
	let fixture: Fixture;

	// Reads by file path: `fixture.readFile` resolves a URL, which turns `\` into `/`.
	async function readSlug(file: string) {
		const html = await readFile(join(fileURLToPath(fixture.config.outDir), file), 'utf-8');
		return cheerioLoad(html)('#slug').text();
	}

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static-paths-special-chars/',
		});
		await fixture.build();
	});

	for (const [slug, file] of [
		['50%-off', '50%-off/index.html'],
		['a\\b', 'a\\b/index.html'],
		['café', 'café/index.html'],
	]) {
		// The fixture omits `a\b` on Windows, where `\` is a path separator.
		const skip = slug === 'a\\b' && process.platform === 'win32';
		it(`writes the page for \`${slug}\``, { skip }, async () => {
			assert.equal(await readSlug(file), slug);
		});
	}

	it('writes the page for `tag#1`', async () => {
		assert.ok(await readSlug('tag%231/index.html'));
	});
});
