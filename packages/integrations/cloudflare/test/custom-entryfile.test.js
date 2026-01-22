import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadFixture } from './_test-utils.js';

describe('Custom entry file', () => {
	let fixture;
	let previewServer;
	const root = new URL('./fixtures/custom-entryfile/', import.meta.url);

	before(async () => {
		console.log('[cloudflare:test] Custom entry file before');
		fixture = await loadFixture({
			root: './fixtures/custom-entryfile/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		console.log('[cloudflare:test] Custom entry file after');
		await previewServer.stop();
		console.log('[cloudflare:test] Custom entry file finished');
	});

	it('filters out duplicate "default" export and builds', async () => {
		const filePath = fileURLToPath(new URL('dist/_worker.js', root));
		const hasBuilt = existsSync(filePath);
		assert.equal(hasBuilt, true, `Expected ${filePath} to exist after build`);
	});

	it('uses custom entrypoint', async () => {
		const response = await fixture.fetch('/');
		assert.equal(
			response.headers.get('X-Custom-Entrypoint'),
			'true',
			'Expected custom entrypoint to add X-Custom-Entrypoint header',
		);
	});
});
