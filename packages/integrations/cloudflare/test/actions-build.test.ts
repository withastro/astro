import * as assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Actions build', () => {
	let fixture: Fixture;
	let viteCacheDir: URL;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/actions-build/',
		});
		viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		await rm(fileURLToPath(viteCacheDir), { recursive: true, force: true });
	});

	after(async () => {
		await fixture.clean();
		await rm(fileURLToPath(viteCacheDir), { recursive: true, force: true });
	});

	it('builds repeatedly with a warm Vite dependency cache', async () => {
		await fixture.build();
		assert.match(await fixture.readFile('/client/index.html'), /<h1>Actions build<\/h1>/);

		// Keep node_modules/.vite between builds to cover the stale dependency cache
		// that previously caused Cloudflare builds with Actions to fail.
		await fixture.clean();
		await fixture.build();
		assert.match(await fixture.readFile('/client/index.html'), /<h1>Actions build<\/h1>/);
	});
});
