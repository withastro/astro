import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
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
});
