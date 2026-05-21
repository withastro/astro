import { rmSync } from 'node:fs';
import { describe, before, it } from 'node:test';
import { Writable } from 'node:stream';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AstroLogger, type AstroLoggerMessage } from '../../../astro/dist/core/logger/core.js';

describe('ts file default-importing an .astro component', () => {
	let fixture: Fixture;
	const logs: AstroLoggerMessage[] = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ts-astro-import/',
		});

		// Clear the Vite cache so dep optimization runs from scratch
		// and the esbuild scan actually exercises the plugin path under test.
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		await fixture.build({
			vite: { logLevel: 'error' },
			// @ts-expect-error: logger is internal API
			logger: new AstroLogger({
				level: 'error',
				destination: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			}),
		});
	});

	it('should not produce "No matching export" error when a .ts module default-imports a .astro component', async () => {
		// Regression test for #16203. Without `namespace: 'file'` on the
		// astro-frontmatter-scan onLoad handler, Vite's dep scanner resolves
		// `.astro` files into the `html` namespace and the plugin still
		// intercepts them, returning only the frontmatter (no `export default`)
		// and producing:
		//   No matching export in "html:/.../Component.astro" for import "default"
		const noMatchingExportLog = logs.find(
			(log) =>
				log.message &&
				log.message.includes('No matching export') &&
				log.message.includes('html:') &&
				log.message.includes('for import "default"'),
		);

		assert.ok(
			!noMatchingExportLog,
			`Should not see "No matching export in 'html:...' for import 'default'" message, but got: ${noMatchingExportLog?.message}`,
		);
	});

	it('should complete dependency scanning successfully', async () => {
		const dependencyScanFailedLog = logs.find(
			(log) => log.message && log.message.includes('Failed to run dependency scan'),
		);

		assert.ok(
			!dependencyScanFailedLog,
			`Should not see "Failed to run dependency scan" message, but got: ${dependencyScanFailedLog?.message}`,
		);
	});
});
