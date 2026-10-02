import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Prerender with durable objects (exports field)', () => {
	let fixture: Fixture;
	const root = new URL('./fixtures/prerender-durable-object-exports/', import.meta.url);
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender-durable-object-exports/',
		});
		await fixture.build();
	});

	it('builds without ERR_RUNTIME_FAILURE when wrangler config has exports field', () => {
		// The wrangler `exports` field is the newer, declarative alternative to
		// `migrations` for configuring Durable Objects. Like `migrations`, it must
		// be stripped from the prerender worker config so the prerender entrypoint
		// (which does not export user DO classes) can start without errors.
		const distPath = fileURLToPath(new URL('dist/client/', root));
		assert.ok(existsSync(distPath), `Expected ${distPath} to exist after build`);
	});

	it('ships the custom Worker entrypoint with its Durable Object exports', () => {
		const entryPath = fileURLToPath(new URL('dist/server/entry.mjs', root));
		assert.ok(existsSync(entryPath), `Expected ${entryPath} to exist after build`);
		assert.match(readFileSync(entryPath, 'utf-8'), /export\s*\{[^}]*\bExampleDO\b/);
	});

	it('points the generated wrangler.json main at the emitted entry', () => {
		const wranglerPath = fileURLToPath(new URL('dist/server/wrangler.json', root));
		const wranglerConfig = JSON.parse(readFileSync(wranglerPath, 'utf-8'));
		assert.equal(wranglerConfig.main, 'entry.mjs');
	});
});
