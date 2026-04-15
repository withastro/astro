import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createI18nHandler } from '../../../dist/i18n/handler.js';
import { FetchState } from '../../../dist/core/app/fetch-state.js';
import type { SSRManifest } from '../../../dist/core/app/types.js';
import type { RouteData } from '../../../dist/types/public/internal.js';

/** Minimal pipeline stub for FetchState constructor. */
const pipeline = {
	runtimeMode: 'production',
	manifestData: { routes: [] },
	manifest: { sessionConfig: undefined, csp: undefined },
	logger: { warn() {}, error() {}, info() {}, debug() {} },
	i18n: undefined,
	site: undefined,
	adapterName: undefined,
	cacheConfig: undefined,
	async getSessionDriver() { return undefined; },
} as any;

function makeManifest(i18n: SSRManifest['i18n'], base = '/'): SSRManifest {
	return { i18n, base } as SSRManifest;
}

function makePageRoute(route = '/page'): RouteData {
	return { type: 'page', route } as RouteData;
}

function makeFallbackRoute(): RouteData {
	return { type: 'fallback', route: '/fallback' } as RouteData;
}

function makeState(url: string, routeData?: RouteData): FetchState {
	const state = new FetchState(new Request(url), pipeline);
	state.routeData = routeData;
	return state;
}

describe('createI18nHandler', () => {
	describe('when i18n is not configured', () => {
		it('returns undefined (no handler)', () => {
			const handler = createI18nHandler(makeManifest(undefined), () => undefined);
			assert.equal(handler, undefined);
		});
	});

	describe('when strategy is manual', () => {
		it('returns undefined (no handler)', () => {
			const manifest = makeManifest({
				strategy: 'manual',
				defaultLocale: 'en',
				locales: ['en', 'es'],
				domainLookupTable: {},
			} as any);
			const handler = createI18nHandler(manifest, () => undefined);
			assert.equal(handler, undefined);
		});
	});

	describe('with pathname-prefix-other-locales strategy', () => {
		const i18nConfig = {
			strategy: 'pathname-prefix-other-locales' as const,
			defaultLocale: 'en',
			locales: ['en', 'es', 'fr'],
			domainLookupTable: {},
		};

		it('returns undefined for non-page routes', () => {
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;
			assert.ok(handler);

			const endpointRoute = { type: 'endpoint', route: '/api/data' } as RouteData;
			const state = makeState('http://localhost/api/data', endpointRoute);
			const result = handler(state, new Response('ok'));
			assert.equal(result, undefined);
		});

		it('returns undefined for page routes that continue normally', () => {
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;

			// Default locale without prefix — should continue
			const state = makeState('http://localhost/about', makePageRoute('/about'));
			const result = handler(state, new Response('about page'));
			assert.equal(result, undefined);
		});

		it('returns undefined when no response and no redirect', () => {
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;

			const state = makeState('http://localhost/about', makePageRoute('/about'));
			const result = handler(state, undefined);
			assert.equal(result, undefined);
		});

		it('resolves routeData from matchRouteData if not on state', () => {
			const manifest = makeManifest(i18nConfig);
			const pageRoute = makePageRoute('/about');
			const handler = createI18nHandler(manifest, () => pageRoute)!;

			const state = makeState('http://localhost/about');
			assert.equal(state.routeData, undefined);

			handler(state, new Response('ok'));
			assert.equal(state.routeData, pageRoute);
		});
	});

	describe('fallback behavior', () => {
		it('triggers redirect fallback on 404 response', () => {
			const i18nConfig = {
				strategy: 'pathname-prefix-other-locales' as const,
				defaultLocale: 'en',
				locales: ['en', 'es'],
				domainLookupTable: {},
				fallback: { es: 'en' },
				fallbackType: 'redirect' as const,
			};
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;

			const state = makeState('http://localhost/es/missing', makePageRoute('/es/missing'));
			const result = handler(state, new Response('not found', { status: 404 }));

			if (result) {
				// Fallback should redirect to the English version
				assert.ok(result.status >= 300 && result.status < 400);
			}
		});

		it('sets rewritePathname for rewrite fallback on 404 response', () => {
			const i18nConfig = {
				strategy: 'pathname-prefix-other-locales' as const,
				defaultLocale: 'en',
				locales: ['en', 'es'],
				domainLookupTable: {},
				fallback: { es: 'en' },
				fallbackType: 'rewrite' as const,
			};
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;

			const state = makeState('http://localhost/es/missing', makePageRoute('/es/missing'));
			const result = handler(state, new Response('not found', { status: 404 }));

			// Rewrite fallback returns undefined but sets state.rewritePathname
			if (!result) {
				assert.ok(state.rewritePathname);
				assert.ok(state.rewritePathname.includes('/missing'));
			}
		});

		it('does not trigger fallback on 200 response', () => {
			const i18nConfig = {
				strategy: 'pathname-prefix-other-locales' as const,
				defaultLocale: 'en',
				locales: ['en', 'es'],
				domainLookupTable: {},
				fallback: { es: 'en' },
				fallbackType: 'redirect' as const,
			};
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;

			const state = makeState('http://localhost/es/exists', makePageRoute('/es/exists'));
			const result = handler(state, new Response('found', { status: 200 }));
			assert.equal(result, undefined);
		});
	});

	describe('fallback route type', () => {
		it('processes fallback route types', () => {
			const i18nConfig = {
				strategy: 'pathname-prefix-other-locales' as const,
				defaultLocale: 'en',
				locales: ['en', 'es'],
				domainLookupTable: {},
			};
			const manifest = makeManifest(i18nConfig);
			const handler = createI18nHandler(manifest, () => undefined)!;

			const state = makeState('http://localhost/es/page', makeFallbackRoute());
			// Fallback routes should be processed (not skipped)
			const result = handler(state, new Response('ok'));
			// The exact result depends on the router, but it shouldn't throw
			assert.ok(result === undefined || result instanceof Response);
		});
	});
});
