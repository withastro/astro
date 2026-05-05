import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AstroLogger } from '../../../astro/dist/core/logger/core.js';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('user optimizeDeps settings propagate to SSR environments', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	const logs: Array<{ message?: string }> = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-loader/',
		});

		// Clear Vite cache to ensure dep optimization runs fresh each time
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		const logger = new AstroLogger({
			level: 'error',
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
	});

	it('optimizeDeps.exclude is respected by SSR dep optimization', async () => {
		// Trigger SSR rendering, which activates the lazy SSR dep optimizer.
		// fake-data-pkg imports a .data file which would cause esbuild to throw
		// "No loader is configured for .data files" if the user's exclude is
		// not forwarded to the server environment (regression: issue #16491).
		const res = await fixture.fetch('/');
		const html = await res.text();

		assert.equal(res.status, 200, `Expected 200, got ${res.status}. Body: ${html}`);

		// The page renders the raw content of bindings.data via ?raw import
		assert.ok(
			html.includes('FAKE_BINARY_DATA'),
			`Expected page to include data file content, got: ${html}`,
		);

		// No esbuild loader error should have appeared in logs
		const loaderError = logs.find(
			(log) => log.message && log.message.includes('No loader is configured'),
		);
		assert.ok(
			!loaderError,
			`esbuild loader error should not appear when package is excluded, but got: ${loaderError?.message}`,
		);
	});
});
