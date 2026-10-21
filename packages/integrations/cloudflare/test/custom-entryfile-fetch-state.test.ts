import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
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
			server: { port: 48082 },
		});
		await fixture.build();
		await writeFile(
			new URL('./fixtures/custom-entryfile-fetch-state/dist/client/stray.txt', import.meta.url),
			'stray file body',
		);
		previewServer = await fixture.preview();
	});

	after(async () => {
		await previewServer.stop();
		await fixture.clean();
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

	it('writes cookies and defaults uncached responses to no-store', async () => {
		const response = await fixture.fetch('/');

		assert.equal(response.headers.get('set-cookie')?.match(/repro=1/g)?.length, 1);
		assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
	});

	it('preserves a session across requests', async () => {
		const firstResponse = await fixture.fetch('/session');
		const sessionCookie = /astro-session=[^;,]+/.exec(
			firstResponse.headers.get('set-cookie') ?? '',
		)?.[0];
		assert.ok(sessionCookie);
		assert.match(await firstResponse.text(), /count: 1/);

		const secondResponse = await fixture.fetch('/session', {
			headers: { cookie: sessionCookie },
		});
		assert.match(await secondResponse.text(), /count: 2/);
	});

	it('falls back to the assets binding when no Astro route matches', async () => {
		const response = await fixture.fetch('/stray.txt');

		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'stray file body');
	});

	it('applies response headers to Hono-rendered pages', async () => {
		const response = await fixture.fetch('/hono');

		assert.equal(response.headers.get('set-cookie')?.match(/hono=1/g)?.length, 1);
		assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
	});

	it('preserves cookies when finalizing immutable Hono responses', async () => {
		const response = await fixture.fetch('/hono-immutable', { redirect: 'manual' });

		assert.equal(response.status, 302);
		assert.match(response.headers.get('set-cookie') ?? '', /hono-immutable=1/);
		assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
	});

	it('preserves cookies when rendering a custom error page', async () => {
		const response = await fixture.fetch('/error');
		const cookies = response.headers.get('set-cookie') ?? '';

		assert.equal(response.status, 500);
		assert.match(await response.text(), /Custom error page/);
		assert.match(cookies, /before-error=1/);
	});

	it('uses the default server entrypoint for workerd prerendering', async () => {
		const html = await fixture.readFile('/client/static/index.html');
		assert.match(html, /prerendered through workerd/);
	});
});

describe('Custom entry file using astro/fetch in dev', () => {
	let fixture: Fixture;
	let devServer: DevServer;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-entryfile-fetch-state/',
			server: { port: 48082 },
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
