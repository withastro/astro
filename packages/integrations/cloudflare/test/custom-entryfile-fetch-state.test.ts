import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { type DevServer, type Fixture, loadFixture, type PreviewServer } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/17591:
// a custom worker entryfile that builds its own request state with
// `new FetchState(request)` from a bare workerd request — one that never
// passed through `app.render()` — and renders with `astro(state)`.
describe('Custom entry file using astro/fetch', () => {
	let fixture: Fixture;
	let previewServer: PreviewServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-entryfile-fetch-state/',
		});
		await fixture.build();
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
	});

	it('renders an SSR page from a state built with new FetchState(request)', async () => {
		const response = await fixture.fetch('/');
		assert.equal(response.status, 200);
		const html = await response.text();
		assert.match(html, /astro-cloudflare-custom-entryfile-fetch-state/);
	});

	it('handles the request through the custom worker', async () => {
		const response = await fixture.fetch('/');
		assert.equal(
			response.headers.get('X-Fetch-State-Entrypoint'),
			'true',
			'Expected the custom worker to add X-Fetch-State-Entrypoint header',
		);
	});
});

describe('Custom entry file using astro/fetch in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-entryfile-fetch-state/',
		});
		// Optimizer plugins are not included in Vite's cache key.
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer.stop();
	});

	it('renders an SSR page from a state built with new FetchState(request)', async () => {
		const response = await fixture.fetch('/');
		const html = await response.text();
		assert.equal(response.status, 200, html);
		assert.equal(response.headers.get('X-Fetch-State-Entrypoint'), 'true');
		assert.match(html, /astro-cloudflare-custom-entryfile-fetch-state/);
	});
});
