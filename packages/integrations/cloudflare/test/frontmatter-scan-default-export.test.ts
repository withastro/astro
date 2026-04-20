import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { before, describe, it } from 'node:test';
import { AstroLogger } from '../../../astro/dist/core/logger/core.js';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Frontmatter scan default export', () => {
	let fixture: Fixture;
	const logs: Array<{ message?: string }> = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/frontmatter-scan-default-export/',
		});

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

	it('should avoid no matching default export errors during dep scan', () => {
		const defaultExportErrorLog = logs.find(
			(log) =>
				log.message &&
				log.message.includes('No matching export') &&
				log.message.includes('for import "default"'),
		);

		assert.ok(
			!defaultExportErrorLog,
			`Should not see "No matching export ... for import default" message, but got: ${defaultExportErrorLog?.message}`,
		);
	});
});
