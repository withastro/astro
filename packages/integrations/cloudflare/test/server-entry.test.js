import { describe, it } from 'node:test';
import { loadFixture } from './_test-utils.js';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Server entry', () => {
	let fixture;
	it('should load the custom entry when using legacy entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
		});

		await fixture.build();

		const itExits = existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir)));

		assert.ok(itExits);
	});
});
