import { describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Static output', () => {
	let fixture: Fixture;
	it('should not output a _worker.js directory for fully static sites', async () => {
		fixture = await loadFixture({
			root: './fixtures/static',
		});

		await fixture.build();

		const workerExists = existsSync(fileURLToPath(new URL('_worker.js', fixture.config.outDir)));

		assert.ok(!workerExists, '_worker.js directory should not exist for static sites');
	});
});
