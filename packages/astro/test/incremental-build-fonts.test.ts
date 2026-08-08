import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild with the fonts API', () => {
	const root = new URL('./fixtures/incremental-build-fonts/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	const ROUTE = 'src/pages/[slug].astro';

	function dependencyHash(): string | undefined {
		const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		return cache.routes[ROUTE]?.dependencyHash;
	}

	async function build(): Promise<void> {
		const fixture = await loadFixture({
			root,
			experimental: { incrementalBuild: true },
		});
		await fixture.build();
	}

	let first: string | undefined;
	let second: string | undefined;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });

		await build();
		first = dependencyHash();
		await build();
		second = dependencyHash();
	});

	it('records a dependency hash for the route', () => {
		assert.ok(first, 'expected a dependency hash after the first build');
	});

	// The font file URL resolver module embeds the address of the font preview
	// server, which listens on an ephemeral port. Without excluding it from the
	// hash, this changes on every build and no page is ever reused.
	it('keeps the dependency hash stable across identical builds', () => {
		assert.equal(second, first);
	});
});
