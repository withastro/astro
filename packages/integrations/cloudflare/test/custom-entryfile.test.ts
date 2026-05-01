import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Custom entry file', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;
	const root = new URL('./fixtures/custom-entryfile/', import.meta.url);

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-entryfile/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('filters out duplicate "default" export and builds', async () => {
		const filePath = fileURLToPath(new URL('dist/server', root));
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
