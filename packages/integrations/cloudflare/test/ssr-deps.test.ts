import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
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
});
