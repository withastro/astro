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

	it('should not output a _worker.js directory for fully static sites', async () => {
		const workerExists = existsSync(fileURLToPath(new URL('_worker.js', fixture.config.outDir)));

		assert.ok(!workerExists, '_worker.js directory should not exist for static sites');
	});

	it('does not prepend the process shim banner to client scripts', async () => {
		const html = await fixture.readFile('/client/index.html');
		assert.ok(html.includes('data-ready'), 'Expected the client script to be in the output');
		assert.ok(!html.includes('globalThis.process'));
		for (const file of await fixture.glob('client/_astro/*.js')) {
			const js = await fixture.readFile('/' + file);
			assert.ok(!js.includes('globalThis.process'), `${file} should not contain the process shim`);
		}
	});
});
