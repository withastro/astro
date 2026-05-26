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

	it('starts the preview server without attempting a remote proxy session', async () => {
		// The fixture's wrangler config declares a KV namespace flagged `remote: true`,
		// and the adapter is configured with `remoteBindings: false`. The cloudflare
		// vite plugin must observe `remoteBindings: false` and skip
		// `wrangler.maybeStartOrUpdateRemoteProxySession`, which would otherwise fail
		// in environments without Cloudflare credentials.
		//
		// This regresses whenever the `astro preview` entrypoint drops user adapter
		// options on the floor — see #16705 for the equivalent bug on the prerenderer
		// path.
		await assert.doesNotReject(async () => {
			previewServer = await fixture.preview();
		}, 'preview server should start without requiring Cloudflare credentials');
	});
});
