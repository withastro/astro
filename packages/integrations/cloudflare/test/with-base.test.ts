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
			// @ts-expect-error: `_logger` is an internal API
			_logger: logger,
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

	it('injects cache headers for assets with base prefix', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.match(content, /\/blog\/_astro\/\*/);
		assert.match(content, /Cache-Control: public, max-age=31536000, immutable/);
	});

	it('preserves existing user-defined headers', async () => {
		const content = await fixture.readFile('client/_headers');
		assert.match(content, /X-Custom-Header: 67/);
	});

	it('places the injected cache block before existing user-defined headers', async () => {
		// Ordering matters when both rules match the same path: per Cloudflare
		// docs, multiple matching rules' headers are merged, and we want the
		// asset-specific rule to be readable first in the file.
		const content = await fixture.readFile('client/_headers');
		const cacheIdx = content.indexOf('/blog/_astro/*');
		const userIdx = content.indexOf('X-Custom-Header: 67');
		assert.ok(cacheIdx >= 0 && userIdx >= 0, 'both blocks should exist');
		assert.ok(cacheIdx < userIdx, 'cache block should appear before user headers');
	});

	it('sets assets.directory to the un-prefixed client root in wrangler.json', async () => {
		const raw = await fixture.readFile('server/wrangler.json');
		const config = JSON.parse(raw);
		assert.equal(
			config.assets.directory,
			'../client',
			'assets.directory should be "../client", not "../client/blog"',
		);
	});
});
