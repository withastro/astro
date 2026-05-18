import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { Writable } from 'node:stream';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import { AstroLogger } from 'astro/_internal/logger';
import { fileURLToPath } from 'node:url';

describe('base', () => {
	let fixture: Fixture;
	const logs: Array<{ message?: string }> = [];

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/with-base/',
		});

		// Clear the Vite cache before testing
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);

		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		const logger = new AstroLogger({
			level: 'debug',
			destination: new Writable({
				objectMode: true,
				write(event, _, callback) {
					logs.push(event);
					callback();
				},
			}),
		});
		await fixture.build({
			vite: { logLevel: 'info' },
			// @ts-expect-error: logger is internal API
			logger,
		});
	});

	after(async () => {
		await fixture.clean();
	});

	it('correctly prints redirects at the client root', async () => {
		const fileContent = await fixture.readFile('client/_redirects');
		assert.match(fileContent, /\/a\/redirect\s+\/\s+301/);
		assert.match(fileContent, /\/a\/redirect\/\s+\/\s+301/);
	});

	it('places prerendered pages under the base prefix', async () => {
		assert.ok(
			fixture.pathExists('client/blog/static/index.html'),
			'prerendered page should be at client/blog/static/index.html',
		);
	});

	it('places public files under the base prefix', async () => {
		assert.ok(
			fixture.pathExists('client/blog/favicon.ico'),
			'public file should be at client/blog/favicon.ico',
		);
	});

	it('keeps .assetsignore at the client root', async () => {
		assert.ok(
			fixture.pathExists('client/.assetsignore'),
			'.assetsignore should be at client/.assetsignore (not under base)',
		);
	});

	it('keeps _headers at the client root', async () => {
		assert.ok(
			fixture.pathExists('client/_headers'),
			'_headers should be at client/_headers (not under base)',
		);
	});
});
