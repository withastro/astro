import { rmSync } from 'node:fs';
import { describe, before, it } from 'node:test';
import { Writable } from 'node:stream';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AstroLogger } from 'astro/_internal/logger';

describe('Top-level Return', () => {
	let fixture: Fixture;
	const logs: Array<{ message?: string }> = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/top-level-return/',
		});

		// Clear the Vite cache before testing
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

		await fixture.build({
			vite: { logLevel: 'error' },
			// @ts-expect-error: logger is internal API
			logger,
		});
	});

	it('should avoid esbuild top-level return error by replacing with void', async () => {
		const topLevelReturnErrorLog = logs.find(
			(log) =>
				log.message &&
				log.message.includes('Top-level return cannot be used inside an ECMAScript module'),
		);

		assert.ok(
			!topLevelReturnErrorLog,
			`Should not see "Top-level return cannot be used inside an ECMAScript module" message, but got: ${topLevelReturnErrorLog?.message}`,
		);
	});

	it('should not break JS syntax and should complete dependency scanning successfully', async () => {
		const dependencyScanFailedLog = logs.find(
			(log) => log.message && log.message.includes('Failed to run dependency scan'),
		);

		assert.ok(
			!dependencyScanFailedLog,
			`Should not see "Failed to run dependency scan" message, but got: ${dependencyScanFailedLog?.message}`,
		);
	});
});
