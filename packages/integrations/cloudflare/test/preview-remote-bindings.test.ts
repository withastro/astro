import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

describe('astro preview with remoteBindings: false', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer | undefined;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/preview-remote-bindings/',
		});
		await fixture.build();
	});

	after(async () => {
		await previewServer?.stop();
	});

	// assumption: will reject in CI since since remote proxy session is expected unavailable in CI
	it('starts the preview server without attempting a remote proxy session', async () => {
		await assert.doesNotReject(async () => {
			previewServer = await fixture.preview();
		}, 'preview server should start without requiring Cloudflare credentials');
	});
});
