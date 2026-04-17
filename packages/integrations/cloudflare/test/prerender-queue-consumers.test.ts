import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('Prerender with queue consumers', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/prerender-queue-consumers/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		previewServer.stop();
	});

	it('builds and previews without ERR_MULTIPLE_CONSUMERS', async () => {
		// The prerendered page should be accessible
		const res = await fixture.fetch('/');
		const html = await res.text();
		assert.ok(html.includes('Prerendered Page'));
	});

	it('serves the SSR endpoint', async () => {
		const res = await fixture.fetch('/api');
		const json = await res.json();
		assert.deepEqual(json, { ok: true });
	});
});
