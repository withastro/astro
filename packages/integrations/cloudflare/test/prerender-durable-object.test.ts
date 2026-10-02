import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Prerender with durable objects', () => {
	let fixture: Fixture;
	const root = new URL('./fixtures/prerender-durable-object/', import.meta.url);
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender-durable-object/',
		});
		await fixture.build();
	});

	it('builds without ERR_RUNTIME_FAILURE when wrangler config has durable_objects', () => {
		// Before the fix, this build crashed with:
		//   "Class extends value undefined is not a constructor or null"
		// because durable_objects and migrations leaked into the prerender worker
		// config while `main` was overridden to the default Astro entrypoint
		// (which does not export the user's Durable Object classes).
		const distPath = fileURLToPath(new URL('dist/client/', root));
		assert.ok(existsSync(distPath), `Expected ${distPath} to exist after build`);
	});

	it('ships the custom Worker entrypoint with its Durable Object exports', () => {
		const entryPath = fileURLToPath(new URL('dist/server/entry.mjs', root));
		assert.ok(existsSync(entryPath), `Expected ${entryPath} to exist after build`);
		assert.match(readFileSync(entryPath, 'utf-8'), /export\s*\{[^}]*\bExampleDO\b/);
	});
});
