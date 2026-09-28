import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Custom entry file', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

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
		assert.equal(fixture.pathExists('server'), true, 'Expected the server output to exist');
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
