import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

describe('Cache headers on responses with immutable headers', () => {
	let fixture: Fixture;
	let app: App;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-immutable-response/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/cache-immutable-response/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();
	});

	it('applies cache headers to a fetch()-proxied response instead of failing the request', async () => {
		const response = await app.render(new Request('http://example.com/proxy'));
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'proxied');
		assert.equal(response.headers.get('X-Astro-Cache'), 'MISS');
	});

	it('serves the proxied response from cache on the next request', async () => {
		const response = await app.render(new Request('http://example.com/proxy'));
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'proxied');
		assert.equal(response.headers.get('X-Astro-Cache'), 'HIT');
	});
});

describe('Provider responses with immutable headers', () => {
	let fixture: Fixture;
	let app: App;
	let server: http.Server;
	let serverUrl: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/cache-provider-immutable/',
			output: 'server',
			adapter: testAdapter(),
			outDir: './dist/cache-provider-immutable/',
		});
		await fixture.build({});
		app = await fixture.loadTestAdapterApp();

		server = http.createServer((_req, res) => {
			res.setHeader('CDN-Cache-Control', 'max-age=300');
			res.setHeader('Cache-Tag', 'upstream');
			res.end('upstream-hit');
		});
		server.listen(0);
		await once(server, 'listening');
		const address = server.address();
		assert.ok(address && typeof address === 'object');
		serverUrl = `http://localhost:${address.port}/`;
	});

	after(() => {
		server?.close();
		delete process.env.CACHE_PROVIDER_IMMUTABLE_URL;
	});

	it('returns a provider response without CDN headers as-is', async () => {
		process.env.CACHE_PROVIDER_IMMUTABLE_URL = 'data:text/plain,cache-hit';
		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'cache-hit');
	});

	it('strips CDN headers from an immutable provider response instead of failing', async () => {
		process.env.CACHE_PROVIDER_IMMUTABLE_URL = serverUrl;
		const response = await app.render(new Request('http://example.com/'));
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'upstream-hit');
		assert.equal(response.headers.get('CDN-Cache-Control'), null);
		assert.equal(response.headers.get('Cache-Tag'), null);
	});
});
