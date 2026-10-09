import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('User optimizeDeps forwarding', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/user-optimize-deps/',
		});

		// Clear Vite cache to ensure dependencies are discovered fresh
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('respects user optimizeDeps.exclude for SSR environments', async () => {
		// When a user sets `optimizeDeps.exclude` for a package that imports
		// non-standard file types (e.g. .data), the adapter should forward that
		// setting to server environments so the dep optimizer skips the package.
		const res = await fixture.fetch('/');
		const html = await res.text();

		assert.ok(
			html.includes('FAKE_BINARY_DATA'),
			`Expected page to render with data from the excluded package, but got: ${html.slice(0, 200)}`,
		);
	});
});
