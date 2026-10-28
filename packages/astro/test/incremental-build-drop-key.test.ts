import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild dropped cacheKey', () => {
	const root = new URL('./fixtures/incremental-build-drop-key/', import.meta.url);
	const page = new URL('src/pages/[slug].astro', root);
	const outFile = new URL('dist/a/index.html', root);

	async function build(): Promise<void> {
		const fixture = await loadFixture({
			root,
			experimental: { incrementalBuild: true },
		});
		await fixture.build();
	}

	let original: string;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		original = fs.readFileSync(page, 'utf-8');

		// First build: the path is keyed and recorded in the cache.
		await build();

		// Second build: the path drops its cacheKey. It is still produced, so its
		// freshly rendered output must not be treated as an orphan and deleted.
		fs.writeFileSync(page, original.replace(", cacheKey: 'v1'", ''));
		await build();

		fs.writeFileSync(page, original);
	});

	it('keeps a rendered page that dropped its cacheKey', () => {
		assert.ok(fs.existsSync(outFile), 'the produced page must not be deleted as an orphan');
	});
});
