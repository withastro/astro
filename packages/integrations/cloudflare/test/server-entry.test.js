import { describe, it } from 'node:test';
import { after } from 'node:test';
import { loadFixture } from './_test-utils.js';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Server entry', () => {
	let fixture;
	it('should load the custom entry when using legacy entrypoint', async () => {
		console.log('[cloudflare:test] Server entry test start');
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
		});

		await fixture.build();

		const itExits = existsSync(
			fileURLToPath(new URL('_worker.js/custom.mjs', fixture.config.outDir)),
		);

		assert.ok(itExits);
		console.log('[cloudflare:test] Server entry test done');
	});

	after(() => {
		console.log('[cloudflare:test] Server entry finished');
	});
});
