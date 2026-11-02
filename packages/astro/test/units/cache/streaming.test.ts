import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';
import { describe, it } from 'node:test';
import { App } from '../../../dist/core/app/app.js';
import memoryProvider from '../../../dist/core/cache/memory-provider.js';
import type { CacheLike } from '../../../dist/core/cache/runtime/cache.js';
import type { CacheOptions } from '../../../dist/core/cache/types.js';
import { setLogger } from '../../../dist/core/logger/manifest-logger.js';
import { createComponent, render, renderComponent } from '../../../dist/runtime/server/index.js';
import { createEndpoint, createPage, createTestApp } from '../mocks.ts';
import { SpyLogger } from '../test-utils.ts';

// Model an async layout with a synchronous child. The child's frontmatter has
// no await, but still runs after the page Response has been created (#18499).
function streamingApp({
	runtime = false,
	initial = { maxAge: 300, tags: ['page'] },
	late = (cache) => cache.set({ tags: ['layout'] }),
	streaming = true,
	cookie = false,
	lateCookie = false,
}: {
	runtime?: boolean;
	initial?: CacheOptions;
	late?: (cache: CacheLike) => void;
	streaming?: boolean;
	cookie?: boolean;
	lateCookie?: boolean;
} = {}) {
	let renders = 0;
	const child = createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		Astro.cache.set({ tags: ['sync-child'] });
		return render`<p>child</p>`;
	});
	const layout = createComponent(async (result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		await setTimeout(5);
		if (lateCookie) Astro.cookies.set('session', 'private', { path: '/' });
		late(Astro.cache);
		return render`<html><body>${renderComponent(result, 'Child', child, {})}</body></html>`;
	});
	const page = createComponent((result: any, props: any, slots: any) => {
		const Astro = result.createAstro(props, slots);
		renders++;
		Astro.cache.set(initial);
		if (cookie) Astro.cookies.set('session', 'private', { path: '/' });
		return render`${renderComponent(result, 'Layout', layout, {})}<p>render ${renders}</p>`;
	});
	const testApp = createTestApp(
		[
			createPage(page, { route: '/' }),
			createEndpoint(
				{
					POST: async (ctx) => {
						await ctx.cache.invalidate({ tags: [ctx.url.searchParams.get('tag')!] });
						return new Response(null, { status: 204 });
					},
				},
				{ route: '/invalidate' },
			),
		],
		{
			cacheProvider: async () => ({
				default: runtime ? memoryProvider : () => ({ name: 'cdn', async invalidate() {} }),
			}),
			cacheConfig: {
				provider: runtime ? 'memory' : 'cdn',
				routes: { '/': { tags: ['route-rule'] } },
			},
		},
	);
	const app = new App(testApp.manifest, streaming);
	const logger = new SpyLogger({ level: 'warn' });
	setLogger(app.manifest, logger);
	return {
		app,
		logger,
		request: () => app.render(new Request('http://localhost/'), { addCookieHeader: true }),
		invalidate: (tag: string) =>
			app.render(new Request(`http://localhost/invalidate?tag=${tag}`, { method: 'POST' })),
	};
}

function cacheWarnings(logger: SpyLogger) {
	return logger.logs.filter((log) => log.level === 'warn' && log.label === 'cache');
}

describe('cache directives during streaming', () => {
	for (const tag of ['layout', 'sync-child']) {
		it(`runtime cache invalidation retains the late ${tag} tag`, async () => {
			const { request, invalidate, logger } = streamingApp({ runtime: true });
			const first = await request();
			assert.equal(first.headers.get('X-Astro-Cache'), 'MISS');
			assert.match(await first.text(), /child/);
			assert.equal((await request()).headers.get('X-Astro-Cache'), 'HIT');
			await invalidate(tag);
			assert.equal((await request()).headers.get('X-Astro-Cache'), 'MISS');
			assert.deepEqual(cacheWarnings(logger), []);
		});
	}

	it('does not store private output after a late set(false)', async () => {
		// Keep the child from re-enabling the cache with a positive maxAge.
		const { request, logger } = streamingApp({
			runtime: true,
			late: (cache) => cache.set(false),
		});
		for (let i = 1; i <= 2; i++) {
			const response = await request();
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			assert.match(await response.text(), new RegExp(`render ${i}`));
		}
		assert.deepEqual(cacheWarnings(logger), []);
	});

	it('honors a late maxAge: 0 instead of storing the page', async () => {
		const { request, logger } = streamingApp({
			runtime: true,
			late: (cache) => cache.set({ maxAge: 0 }),
		});
		for (let i = 1; i <= 2; i++) {
			const response = await request();
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			assert.match(await response.text(), new RegExp(`render ${i}`));
		}
		assert.deepEqual(cacheWarnings(logger), []);
	});

	it('preserves Astro cookies across runtime response buffering and skips storage', async () => {
		const { request, logger } = streamingApp({ runtime: true, lateCookie: true });
		for (let i = 1; i <= 2; i++) {
			const response = await request();
			assert.match(response.headers.get('Set-Cookie')!, /session=private/);
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			assert.match(await response.text(), new RegExp(`render ${i}`));
		}
		assert.equal(cacheWarnings(logger).filter((log) => /Set-Cookie/.test(log.message)).length, 2);
		assert.equal(cacheWarnings(logger).filter((log) => /cache\.set/.test(log.message)).length, 0);
	});

	it('preserves early Astro cookies when the provider declines buffering', async () => {
		const { request } = streamingApp({ runtime: true, cookie: true });
		for (let i = 1; i <= 2; i++) {
			const response = await request();
			assert.match(response.headers.get('Set-Cookie')!, /session=private/);
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			assert.match(await response.text(), new RegExp(`render ${i}`));
		}
	});

	it('CDN streaming retains only early HTTP cache headers (documented limitation)', async () => {
		const { request } = streamingApp();
		const response = await request();
		assert.equal(response.headers.get('Cache-Tag'), 'route-rule, page');
		assert.match(await response.text(), /child/);
		assert.equal(response.headers.get('Cache-Tag'), 'route-rule, page');
	});

	it('non-streaming CDN responses include layout and synchronous child tags without warnings', async () => {
		const { request, logger } = streamingApp({ streaming: false });
		const response = await request();
		assert.equal(response.headers.get('Cache-Tag'), 'route-rule, page, layout, sync-child');
		assert.match(await response.text(), /child/);
		assert.deepEqual(cacheWarnings(logger), []);
	});

	it('does not begin runtime caching when first opted in after streaming has begun', async () => {
		const { request } = streamingApp({
			runtime: true,
			initial: {},
			late: (cache) => cache.set({ maxAge: 300 }),
		});
		for (let i = 1; i <= 2; i++) {
			const response = await request();
			assert.equal(response.headers.get('X-Astro-Cache'), null);
			assert.match(await response.text(), new RegExp(`render ${i}`));
		}
	});
});
