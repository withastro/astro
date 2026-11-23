import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import type { SSRManifest } from '../../../dist/core/app/types.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import { createEndpoint, createPage, createRouteData, createTestApp } from '../mocks.ts';
import { dynamicPart, staticPart } from '../routing/test-helpers.ts';

const page = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<p id="path">${Astro.url.pathname}</p><p id="search">${Astro.url.search}</p><p id="locale">${Astro.currentLocale}</p><p id="id">${Astro.params.id}</p>`;
});

interface FallbackAppOptions {
	base?: string;
	trailingSlash?: SSRManifest['trailingSlash'];
	route?: string;
	component?: typeof page;
	middleware?: SSRManifest['middleware'];
	dynamic?: boolean;
}

function fallbackApp(
	fallbackType: 'rewrite' | 'redirect',
	{
		base = '/',
		trailingSlash = 'ignore',
		route = '/live',
		component = page,
		middleware,
		dynamic = false,
	}: FallbackAppOptions = {},
) {
	const segments = dynamic ? [[staticPart('posts')], [dynamicPart('id')]] : undefined;
	const live = createPage(component, { route, segments, trailingSlash });
	if (dynamic) live.routeData.pathname = undefined;
	live.routeData.fallbackRoutes.push(
		createRouteData({
			route: `/de${route}`,
			segments: dynamic ? [[staticPart('de')], ...segments!] : undefined,
			type: 'fallback',
			component: live.routeData.component,
			trailingSlash,
		}),
	);
	const entry = createPage(page, { route: '/entry' });
	return createTestApp([live, entry], {
		base,
		trailingSlash,
		middleware,
		i18n: {
			defaultLocale: 'en',
			locales: ['en', 'de'],
			strategy: 'pathname-prefix-other-locales',
			fallbackType,
			fallback: { de: 'en' },
			domains: {},
			domainLookupTable: {},
		},
	});
}

describe('#18473 on-demand i18n fallback', () => {
	for (const fallbackType of ['rewrite', 'redirect'] as const) {
		for (const base of ['/', '/docs', '/docs/']) {
			for (const trailingSlash of ['ignore', 'always', 'never'] as const) {
				it(`${fallbackType}, base ${base}, trailingSlash ${trailingSlash}`, async () => {
					const prefix = base === '/' ? '' : '/docs';
					const suffix = trailingSlash === 'always' ? '/' : '';
					const search = '?a=1&a=2&encoded=%2F%3F&space=hello+world';
					const app = fallbackApp(fallbackType, { base, trailingSlash });
					const res = await app.render(
						new Request(`http://example.com${prefix}/de/live${suffix}${search}`),
					);
					if (fallbackType === 'redirect') {
						assert.equal(res.status, 302);
						assert.equal(res.headers.get('Location'), `${prefix}/live${suffix}${search}`);
					} else {
						assert.equal(res.status, 200);
						assert.equal(res.headers.get('Location'), null);
						const $ = cheerio.load(await res.text());
						const rewrittenSuffix = prefix && trailingSlash === 'ignore' ? '/' : suffix;
						assert.equal($('#path').text(), `${prefix}/live${rewrittenSuffix}`);
						assert.equal($('#search').text(), search);
						// Locale computation for base-prefixed fallback matches has a separate existing bug.
						if (!prefix) assert.equal($('#locale').text(), 'de');
					}
				});
			}
		}

		it(`${fallbackType} handles a decoded static path under base`, async () => {
			const app = fallbackApp(fallbackType, {
				base: '/docs',
				route: '/café',
				trailingSlash: 'never',
			});
			const res = await app.render(new Request('http://example.com/docs/de/caf%C3%A9?q=%23'));
			if (fallbackType === 'redirect') {
				assert.equal(res.status, 302);
				assert.equal(res.headers.get('Location'), '/docs/caf%C3%A9?q=%23');
			} else {
				assert.equal(res.status, 200);
				const $ = cheerio.load(await res.text());
				assert.equal($('#path').text(), '/docs/caf%C3%A9');
				assert.equal($('#search').text(), '?q=%23');
			}
		});

		it(`${fallbackType} handles dynamic fallback params`, async () => {
			const app = fallbackApp(fallbackType, { route: '/posts/[id]', dynamic: true });
			const res = await app.render(new Request('http://example.com/de/posts/caf%C3%A9?x=1'));
			if (fallbackType === 'redirect') {
				assert.equal(res.status, 302);
				assert.equal(res.headers.get('Location'), '/posts/caf%C3%A9?x=1');
			} else {
				assert.equal(res.status, 200);
				const $ = cheerio.load(await res.text());
				assert.equal($('#id').text(), 'café');
				assert.equal($('#path').text(), '/posts/caf%C3%A9');
			}
		});

		it(`${fallbackType} uses the current pathname after middleware rewrites`, async () => {
			const app = fallbackApp(fallbackType, {
				base: '/docs',
				trailingSlash: 'never',
				middleware: () => ({
					onRequest: (ctx, next) =>
						ctx.url.pathname === '/docs/entry' ? next('/docs/de/live?via=rewrite') : next(),
				}),
			});
			const res = await app.render(new Request('http://example.com/docs/entry?original=1'));
			if (fallbackType === 'redirect') {
				assert.equal(res.status, 302);
				assert.equal(res.headers.get('Location'), '/docs/live?via=rewrite');
			} else {
				assert.equal(res.status, 200);
				const $ = cheerio.load(await res.text());
				assert.equal($('#path').text(), '/docs/live');
				assert.equal($('#search').text(), '?via=rewrite');
			}
		});

		for (const status of [200, 201, 301, 403, 500]) {
			it(`${fallbackType} preserves an explicit page status ${status}`, async () => {
				const component = createComponent((result, props, slots) => {
					const Astro = result.createAstro(props, slots);
					Astro.response.status = status;
					return render`<p id="path">${Astro.url.pathname}</p>`;
				});
				const res = await fallbackApp(fallbackType, { component }).render(
					new Request('http://example.com/de/live'),
				);
				assert.equal(res.status, status);
				assert.equal(res.headers.get('Location'), null);
				assert.equal(
					cheerio
						.load(await res.text())('#path')
						.text(),
					'/de/live',
				);
			});
		}

		for (const status of [302, 307, 308] as const) {
			it(`${fallbackType} preserves a page redirect ${status}`, async () => {
				const component = createComponent((result, props, slots) =>
					result.createAstro(props, slots).redirect('/login?return=%2Fde%2Flive', status),
				);
				const res = await fallbackApp(fallbackType, { component }).render(
					new Request('http://example.com/de/live'),
				);
				assert.equal(res.status, status);
				assert.equal(res.headers.get('Location'), '/login?return=%2Fde%2Flive');
			});
		}

		it(`${fallbackType} leaves the source route alone`, async () => {
			const res = await fallbackApp(fallbackType).render(new Request('http://example.com/live'));
			assert.equal(res.status, 200);
			assert.equal(
				cheerio
					.load(await res.text())('#path')
					.text(),
				'/live',
			);
		});
	}

	it('does not apply page fallback logic to endpoints', async () => {
		const endpoint = createEndpoint(
			{ GET: () => new Response('endpoint', { status: 302 }) },
			{ route: '/live' },
		);
		endpoint.routeData.fallbackRoutes.push(
			createRouteData({ route: '/de/live', type: 'fallback' }),
		);
		const manifest = fallbackApp('redirect').manifest;
		const app = createTestApp([endpoint], { i18n: manifest.i18n });
		const res = await app.render(new Request('http://example.com/de/live'));
		assert.equal(res.status, 302);
		assert.equal(res.headers.get('Location'), null);
		assert.equal(await res.text(), 'endpoint');
	});
});
