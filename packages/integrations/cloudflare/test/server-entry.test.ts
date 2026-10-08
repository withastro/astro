import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Server entry', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
		});

		await fixture.build();
	});

	it('should load the custom entry when using legacy entrypoint', async () => {
		const itExits = existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir)));

		assert.ok(itExits);
	});

	it('prepends the process shim banner to the server entry', async () => {
		const entry = await fixture.readFile('/server/custom.mjs');
		assert.ok(
			entry.startsWith('globalThis.process ??= {};'),
			'Expected the process shim at the top of the server entry',
		);
	});
});
