import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild untransformed image references', () => {
	const root = new URL('./fixtures/incremental-build-referenced-images/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;
	let originalPath: string | undefined;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fixture = await loadFixture({
			root,
			outDir: './dist/referenced-images/',
			output: 'static',
			experimental: {
				incrementalBuild: true,
			},
		});

		await fixture.build();
		const $ = cheerio.load(await fixture.readFile('/cached/x/index.html'));
		originalPath = $('img').attr('src');
	});

	it('preserves an original image referenced by a restored page', async () => {
		const src = originalPath;
		assert.ok(src, 'expected the cached page to reference an image');
		assert.ok(fixture.pathExists(src), 'original image should exist after the warm build');

		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		const pathEntry = cache.routes['src/pages/cached/[slug].astro'].paths['/cached/x'];
		assert.ok(
			pathEntry.referencedImages?.length > 0,
			'the path should record its untransformed image references',
		);

		await fixture.build();
		assert.ok(
			fixture.pathExists(src),
			'original image referenced by the restored page should still be emitted',
		);
	});
});
