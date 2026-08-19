import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, getVercelConfig, loadFixture } from './test-utils.ts';

const destOf = (routes: { src?: string; dest?: string }[], src: string) =>
	routes.find((route) => route.src === src)?.dest;

/**
 * With `isr`, every route used to be pointed straight at the ISR function, so
 * the middleware edge function was built and deployed but never invoked — and
 * ISR skips the function entirely on a cache hit, so middleware stopped running
 * once an entry was warm.
 */
describe('ISR with edge middleware', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/isr-with-edge-middleware/',
		});
		await fixture.build({});
	});

	/** The URL `next()` forwards to, with `fetch` stubbed out. */
	async function forwardedUrl(path: string): Promise<URL> {
		const entry = new URL(
			'../.vercel/output/functions/_middleware.func/middleware.mjs',
			fixture.config.outDir,
		);
		const module = await import(entry.href);

		const originalFetch = globalThis.fetch;
		let captured: string | undefined;
		globalThis.fetch = async (url) => {
			captured = String(url);
			return new Response('ok');
		};
		try {
			await module.default(new Request(`http://example.com${path}`), {});
		} finally {
			globalThis.fetch = originalFetch;
		}

		assert.ok(captured, 'next() did not forward the request');
		return new URL(captured);
	}

	it('builds the middleware edge function', { timeout: 30000 }, async () => {
		const config = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_middleware.func/.vc-config.json'),
		);
		assert.equal(config.runtime, 'edge');
		assert.equal(config.entrypoint, 'middleware.mjs');
	});

	it('points page routes at the middleware', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);

		// Not `routes.some((r) => r.dest === '_middleware')`: the 404 catch-all
		// always points there, so that passes even when no page route does.
		assert.equal(destOf(routes, '^/$'), '_middleware');
		assert.equal(destOf(routes, '^/cached/([^/]+?)/?$'), '_middleware');
	});

	it('points routes excluded from ISR at the middleware too', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		assert.equal(destOf(routes, '^/live$'), '_middleware');
	});

	it('leaves internal endpoints on the serverless function', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		assert.equal(destOf(routes, '^/_image/?$'), '_render');
		assert.equal(destOf(routes, '^/_server-islands/([^/]+?)/?$'), '_render');
	});

	it('routes every on-demand route kind through the middleware', {
		timeout: 30000,
	}, async () => {
		const { routes } = await getVercelConfig(fixture);
		assert.equal(destOf(routes, '^/api/data/?$'), '_middleware', 'endpoint');
		assert.equal(destOf(routes, '^/404/?$'), '_middleware', '404 page');
	});

	it('leaves prerendered pages as static files', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		assert.equal(destOf(routes, '^/static/?$'), undefined, 'no route: the file is served directly');

		const html = await fixture.readFile('../.vercel/output/static/static/index.html');
		assert.ok(html.includes('<h1>Static</h1>'));
	});

	it('keeps redirects ahead of the middleware', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		const redirect = routes.find((route) => route.src === '^/old$');
		const filesystem = routes.findIndex((route) => route.handle === 'filesystem');

		assert.equal(redirect?.status, 301);
		assert.equal(redirect?.headers.Location, '/');
		assert.ok(routes.indexOf(redirect!) < filesystem, 'redirects resolve before anything else');
	});

	it('keeps the ISR config', { timeout: 30000 }, async () => {
		const config = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.prerender-config.json'),
		);
		assert.equal(config.expiration, 120);
	});

	it('forwards cached routes to the ISR function', { timeout: 30000 }, async () => {
		const url = await forwardedUrl('/');
		assert.equal(url.pathname, '/_isr');
		assert.equal(url.searchParams.get('x_astro_path'), '/');
		assert.ok(
			url.searchParams.get('x_astro_path_token'),
			'the entrypoint ignores an untokened path',
		);
	});

	it('forwards endpoints to the ISR function too', { timeout: 30000 }, async () => {
		const url = await forwardedUrl('/api/data');
		assert.equal(url.pathname, '/_isr');
		assert.equal(url.searchParams.get('x_astro_path'), '/api/data');
	});

	it('forwards dynamic routes with their real path', { timeout: 30000 }, async () => {
		const url = await forwardedUrl('/cached/42');
		assert.equal(url.pathname, '/_isr');
		// The path is the ISR cache key. Getting it wrong gives every page one entry.
		assert.equal(url.searchParams.get('x_astro_path'), '/cached/42');
	});

	it('forwards routes excluded from ISR to the serverless function', {
		timeout: 30000,
	}, async () => {
		// `/live` also matches the `[slug]` route, which is cached: an exclusion
		// only holds if it is checked before the ISR patterns.
		const url = await forwardedUrl('/live');
		assert.equal(url.pathname, '/_render');
	});

	it('still caches the dynamic route the exclusion overlaps', {
		timeout: 30000,
	}, async () => {
		const url = await forwardedUrl('/anything-else');
		assert.equal(url.pathname, '/_isr');
		assert.equal(url.searchParams.get('x_astro_path'), '/anything-else');
	});

	it('renders paths no route matches instead of caching them', {
		timeout: 30000,
	}, async () => {
		// The 404 catch-all reaches the middleware too. Forwarding those to `_isr`
		// would give every unmatched URL a cache entry.
		const url = await forwardedUrl('/no/such/page');
		assert.equal(url.pathname, '/_render');
	});

	it('keeps the query string out of the cache key', { timeout: 30000 }, async () => {
		const url = await forwardedUrl('/?foo=1');
		assert.equal(url.searchParams.get('x_astro_path'), '/');
	});

	/** The build's middleware secret, read back out of the generated middleware. */
	async function middlewareSecret(): Promise<string> {
		const bundle = await fixture.readFile(
			'../.vercel/output/functions/_middleware.func/middleware.mjs',
		);
		const secret = /"x-astro-middleware-secret":\s*"([^"]+)"/.exec(bundle)?.[1];
		assert.ok(secret, 'the generated middleware carries no secret');
		return secret;
	}

	async function isrFetch(path: string, headers: Record<string, string> = {}) {
		const functionConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_isr.func/.vc-config.json'),
		);
		const entry = new URL(
			`../.vercel/output/functions/_isr.func/${functionConfig.handler}`,
			fixture.config.outDir,
		);
		const module = await import(entry.href);

		return module.default.fetch(new Request(`https://example.com${path}`, { headers }));
	}

	it('keeps the query string the middleware forwarded', { timeout: 30000 }, async () => {
		const secret = await middlewareSecret();
		// The query rides the header, not the forward URL: it must not be swallowed
		// by the path override.
		const response = await isrFetch(
			`/_isr?x_astro_path=%2Fapi%2Fdata&x_astro_path_token=${secret}`,
			{
				'x-astro-middleware-secret': secret,
				'x-astro-path': '/api/data?foo=bar',
			},
		);

		assert.deepEqual(await response.json(), { ok: true, query: '?foo=bar' });
	});

	it('keeps the query string the route rewrite passed through', { timeout: 30000 }, async () => {
		const secret = await middlewareSecret();
		// No middleware header: `passQuery` leaves the client's query on the request
		// while the path arrives as a param.
		const response = await isrFetch(
			`/_isr?x_astro_path=%2Fapi%2Fdata&x_astro_path_token=${secret}&foo=bar`,
		);

		assert.deepEqual(await response.json(), { ok: true, query: '?foo=bar' });
	});

	it('still returns the response to the middleware', { timeout: 30000 }, async () => {
		const entry = new URL(
			'../.vercel/output/functions/_middleware.func/middleware.mjs',
			fixture.config.outDir,
		);
		const module = await import(entry.href);

		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => new Response('ok');
		try {
			const response = await module.default(new Request('http://example.com/'), {});
			assert.equal(response.headers.get('x-astro-middleware'), 'ran');
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});

describe('ISR with edge middleware requested but no middleware file', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/isr-edge-no-middleware/',
		});
		await fixture.build({});
	});

	it('routes straight to the ISR function', { timeout: 30000 }, async () => {
		const { routes } = await getVercelConfig(fixture);
		assert.match(destOf(routes, '^/$') ?? '', /^\/_isr\?/);
	});

	it('builds no middleware function', { timeout: 30000 }, async () => {
		await assert.rejects(() =>
			fixture.readFile('../.vercel/output/functions/_middleware.func/.vc-config.json'),
		);
	});
});
