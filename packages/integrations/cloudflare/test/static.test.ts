import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Static output', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/static',
		});

		await fixture.build();
	});

	it('should not output a _worker.js directory for fully static sites', () => {
		const workerExists = existsSync(fileURLToPath(new URL('_worker.js', fixture.config.outDir)));

		assert.ok(!workerExists, '_worker.js directory should not exist for static sites');
	});

	it('emits an assets-only Worker when no custom entrypoint is configured', async () => {
		const workerConfig = JSON.parse(
			await fixture.readFile('../.cloudflare/output/v0/workers/default/worker.config.json'),
		) as { manifest?: { mainModule: string } };

		assert.equal(workerConfig.manifest, undefined);
	});
});
