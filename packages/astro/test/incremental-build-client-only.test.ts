import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('experimental.incrementalBuild client:only dependencies', () => {
	const root = new URL('./fixtures/incremental-build-client-only/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	const depFile = new URL('src/components/dep.js', root);
	const ROUTE = 'src/pages/[slug].astro';

	function routeHash(): string | undefined {
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

	let hashBefore: string | undefined;
	let hashAfter: string | undefined;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(new URL('node_modules/.astro/', root), { recursive: true, force: true });
		fs.writeFileSync(depFile, "export const label = 'v1';\n");

		await build();
		hashBefore = routeHash();

		// Change a dependency of the client:only component. It never enters the
		// prerender graph, so only the client-build fold can catch this.
		fs.writeFileSync(depFile, "export const label = 'v2';\n");
		await build();
		hashAfter = routeHash();

		fs.writeFileSync(depFile, "export const label = 'v1';\n");
	});

	it('records a dependency hash for a route rendering a client:only component', () => {
		assert.ok(hashBefore, 'route should be tracked in the cache');
	});

	it('changes the route dependency hash when a client:only dependency changes', () => {
		assert.notEqual(hashBefore, hashAfter);
	});
});
