import assert from 'node:assert/strict';
import fs from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('incrementalBuild + fonts (#17626)', () => {
	const root = new URL('./fixtures/incremental-build-fonts/', import.meta.url);
	const cacheFile = new URL('node_modules/.astro/incremental-build.json', root);
	let fixture: Fixture;
	let hash1: Record<string, string>;
	let hash2: Record<string, string>;

	before(async () => {
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
		fs.rmSync(cacheFile, { force: true });

		fixture = await loadFixture({
			root,
			experimental: { incrementalBuild: true },
			fonts: [
				{
					provider: (await import('astro/config')).fontProviders.google(),
					name: 'Roboto',
					cssVariable: '--font-test',
				},
			],
		});

		await fixture.build();
		const cache1 = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		hash1 = {};
		for (const [key, val] of Object.entries(cache1.routes)) {
			if ((val as any)?.dependencyHash) hash1[key] = (val as any).dependencyHash;
		}

		await fixture.build();
		const cache2 = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
		hash2 = {};
		for (const [key, val] of Object.entries(cache2.routes)) {
			if ((val as any)?.dependencyHash) hash2[key] = (val as any).dependencyHash;
		}
	});

	after(() => {
		fs.rmSync(cacheFile, { force: true });
		fs.rmSync(new URL('dist/', root), { recursive: true, force: true });
	});

	it('produces stable dependencyHash across builds', () => {
		const routes = Object.keys(hash1);
		assert.ok(routes.length > 0, 'Should have at least one route with dependencyHash');
		for (const route of routes) {
			assert.equal(hash1[route], hash2[route], `dependencyHash changed for "${route}"`);
		}
	});
});
