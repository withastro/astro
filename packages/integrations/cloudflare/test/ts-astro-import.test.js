import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Logger } from '../../../astro/dist/core/logger/core.js';
import { loadFixture } from './_test-utils.js';

describe('TS default-importing .astro components', () => {
	let fixture;
	let devServer;
	const logs = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ts-astro-import/',
		});

		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		devServer = await fixture.startDevServer({
			logger: new Logger({
				level: 'error',
				dest: new Writable({
					objectMode: true,
					write(event, _, callback) {
						logs.push(event);
						callback();
					},
				}),
			}),
		});
	});

	after(async () => {
		await devServer?.stop();
	});

	it('does not produce "No matching export" errors during dep scanning', () => {
		const errors = logs.filter(
			(log) => log.message?.includes('No matching export') && log.message?.includes('.astro'),
		);
		assert.equal(errors.length, 0, `Expected no "No matching export" errors, got: ${errors.map((e) => e.message).join('\n')}`);
	});

	it('renders the page successfully', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);
	});
});
