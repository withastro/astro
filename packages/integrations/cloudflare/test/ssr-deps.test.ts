import * as assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AstroLogger } from '../../../astro/dist/core/logger/core.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('SSR dependencies', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	const logs: Array<{ message?: string }> = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-deps/',
		});

		// Clear Vite cache to ensure dependencies are discovered fresh
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		// Create a fake package that imports a .data file via ?raw. Without the
		// fix for issue #16491, the SSR dep optimizer would fail with
		// "No loader is configured for .data files" even when the user sets
		// optimizeDeps.exclude, because the Cloudflare adapter was not forwarding
		// that setting to server environments.
		const pkgDir = new URL('./node_modules/fake-data-pkg/', fixture.config.root);
		mkdirSync(fileURLToPath(pkgDir), { recursive: true });
		writeFileSync(
			fileURLToPath(new URL('./package.json', pkgDir)),
			JSON.stringify({ name: 'fake-data-pkg', type: 'module', exports: './index.js' }),
		);
		writeFileSync(fileURLToPath(new URL('./bindings.data', pkgDir)), 'FAKE_BINARY_DATA\n');
		writeFileSync(
			fileURLToPath(new URL('./index.js', pkgDir)),
			`import data from './bindings.data?raw';\nexport default data;\n`,
		);

		const logger = new AstroLogger({
			level: 'info',
			destination: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});
		devServer = await fixture.startDevServer({
			// @ts-expect-error: logger is internal API
			logger,
		});
	});

	after(async () => {
		await devServer?.stop();
		const pkgDir = new URL('./node_modules/fake-data-pkg/', fixture.config.root);
		rmSync(fileURLToPath(pkgDir), { recursive: true, force: true });
	});

	it('should discover server-side dependencies ahead of time', async () => {
		// Make a request to trigger SSR rendering which uses the `ms` dependency
		const res = await fixture.fetch('/');
		const html = await res.text();

		// Verify the page rendered correctly with the dependency
		assert.ok(html.includes('172800000'), 'Expected ms() to compute 2 days in milliseconds');

		// Check that we didn't get the "new dependencies optimized" warning
		// This message indicates dependencies weren't discovered ahead of time
		const optimizedLog = logs.find(
			(log) => log.message && log.message.includes('new dependencies optimized'),
		);

		assert.ok(
			!optimizedLog,
			`Should not see "new dependencies optimized" message, but got: ${optimizedLog?.message}`,
		);
	});

	it('should respect user optimizeDeps.exclude in SSR environments', async () => {
		// fake-data-pkg is excluded via optimizeDeps.exclude in astro.config.mjs.
		// Without the fix, the Cloudflare adapter ignored that setting for server
		// environments, causing esbuild to fail on the .data import (#16491).
		const res = await fixture.fetch('/');
		const html = await res.text();

		assert.equal(res.status, 200, `Expected 200, got ${res.status}. Body: ${html}`);
		assert.ok(
			html.includes('FAKE_BINARY_DATA'),
			`Expected page to render fake-data-pkg content, got: ${html}`,
		);
	});
});
