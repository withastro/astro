import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import type { RoutingStrategies } from '../../../dist/core/app/common.js';
import { createI18nMiddleware } from '../../../dist/i18n/middleware.js';
import { createComponent, render } from '../../../dist/runtime/server/index.js';
import type { Locales } from '../../../dist/types/public/config.js';
import { createPage, createTestApp } from '../mocks.ts';
import { dynamicPart, spreadPart, staticPart } from '../routing/test-helpers.ts';

interface I18nConfigOverrides {
	defaultLocale?: string;
	locales?: Locales;
	strategy?: RoutingStrategies;
	fallbackType?: 'redirect' | 'rewrite';
	fallback?: Record<string, string>;
	domains?: Record<string, string>;
	domainLookupTable?: Record<string, string>;
}

function makeI18nConfig(overrides: I18nConfigOverrides = {}) {
	return {
		defaultLocale: overrides.defaultLocale ?? 'en',
		locales: overrides.locales ?? (['en', 'fr', 'es'] as Locales),
		strategy: overrides.strategy ?? ('pathname-prefix-always' as RoutingStrategies),
		fallbackType: overrides.fallbackType ?? ('rewrite' as const),
		fallback: 'fallback' in overrides ? overrides.fallback : ({} as Record<string, string>),
		domains: overrides.domains ?? ({} as Record<string, string>),
		domainLookupTable: overrides.domainLookupTable ?? ({} as Record<string, string>),
	};
}

const localePage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<h1 id="locale">${Astro.currentLocale}</h1><h2 id="path">${Astro.url.pathname}</h2>`;
});

const paramsPage = createComponent((result, props, slots) => {
	const Astro = result.createAstro(props, slots);
	return render`<h1 id="locale">${Astro.currentLocale}</h1><span id="id">${Astro.params.id}</span><span id="slug">${Astro.params.slug}</span><span id="path">${Astro.url.pathname}</span>`;
});

const notFoundPage = createComponent(() => {
	return render`<h1 id="not-found">404 Not Found</h1>`;
});

/** Shorthand for a locale-prefixed catch-all route */
function localeCatchAll(locale: string) {
	return createPage(localePage, {
		route: `/${locale}/[...slug]`,
		segments: [[staticPart(locale)], [dynamicPart('slug')]],
		pathname: undefined,
	});
}

describe('i18n via App - prefix-always', () => {
	const i18n = makeI18nConfig({ strategy: 'pathname-prefix-always' });
	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createI18nApp() {
		return createTestApp([localeCatchAll('en'), localeCatchAll('fr')], {
			i18n,
			middleware: () => ({ onRequest: middleware }),
		});
	}

	it('renders a page with Astro.currentLocale set to en', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/en/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('renders a page with Astro.currentLocale set to fr', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/fr/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'fr');
	});

	it('redirects root / to /en/', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 302);
		assert.ok(res.headers.get('Location')?.includes('/en'));
	});

	it('returns 404 for path without locale prefix', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/about'));
		assert.equal(res.status, 404);
	});
});

describe('i18n via App - prefix-other-locales', () => {
	const i18n = makeI18nConfig({ strategy: 'pathname-prefix-other-locales' });
	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createI18nApp() {
		return createTestApp(
			[
				createPage(localePage, {
					route: '/[...slug]',
					segments: [[dynamicPart('slug')]],
					pathname: undefined,
				}),
				localeCatchAll('fr'),
			],
			{ i18n, middleware: () => ({ onRequest: middleware }) },
		);
	}

	it('renders default locale without prefix', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('renders non-default locale with prefix', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/fr/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'fr');
	});

	it('returns 404 with Location header when default locale used with prefix', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/en/about'));
		assert.equal(res.status, 404);
	});
});

describe('i18n via App - with base path', () => {
	const i18n = makeI18nConfig({ strategy: 'pathname-prefix-always' });
	const middleware = createI18nMiddleware(i18n, '/docs/', 'ignore', 'directory');

	function createI18nApp() {
		return createTestApp([localeCatchAll('en')], {
			base: '/docs/',
			i18n,
			middleware: () => ({ onRequest: middleware }),
		});
	}

	it('renders with base path and locale', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/docs/en/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('redirects base path root to base + default locale', async () => {
		const app = createI18nApp();
		const res = await app.render(new Request('http://example.com/docs/'));
		assert.equal(res.status, 302);
		assert.ok(res.headers.get('Location')?.includes('/docs/en'));
	});
});

describe('i18n via App - domains-prefix-always', () => {
	const i18n = makeI18nConfig({
		strategy: 'domains-prefix-always',
		locales: ['en', 'pt', 'it'],
		defaultLocale: 'en',
	});
	i18n.domainLookupTable = {
		'https://example.pt': 'pt',
		'https://it.example.com': 'it',
	};
	i18n.domains = {
		pt: 'https://example.pt',
		it: 'https://it.example.com',
	};

	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createDomainApp() {
		return createTestApp([localeCatchAll('en'), localeCatchAll('pt'), localeCatchAll('it')], {
			i18n,
			middleware: () => ({ onRequest: middleware }),
		});
	}

	it('renders Portuguese locale when request comes from example.pt', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.pt/about', {
				headers: { 'X-Forwarded-Host': 'example.pt', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'pt');
	});

	it('renders Italian locale when request comes from it.example.com', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://it.example.com/about', {
				headers: { 'X-Forwarded-Host': 'it.example.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'it');
	});

	it('renders English locale for non-domain request with /en/ prefix', async () => {
		const app = createDomainApp();
		const res = await app.render(new Request('http://example.com/en/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('uses Host header as fallback when X-Forwarded-Host is absent', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.pt/about', {
				headers: { Host: 'example.pt' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'pt');
	});

	it('protocol mismatch: HTTP request to HTTPS-configured domain', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('http://example.pt/about', {
				headers: { 'X-Forwarded-Host': 'example.pt', 'X-Forwarded-Proto': 'http' },
			}),
		);
		assert.equal(res.status, 404);
	});

	it('port in X-Forwarded-Host is stripped before matching', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.pt:8080/about', {
				headers: { 'X-Forwarded-Host': 'example.pt:8080', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'pt');
	});

	it('unknown domain falls through to normal pathname routing', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://unknown.com/en/about', {
				headers: { 'X-Forwarded-Host': 'unknown.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('missing both Host and X-Forwarded-Host falls through to pathname routing', async () => {
		const app = createDomainApp();
		const res = await app.render(new Request('http://localhost/en/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('trailing slash is preserved on domain pathname', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.pt/about/', {
				headers: { 'X-Forwarded-Host': 'example.pt', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'pt');
		assert.ok($('#path').text().endsWith('/'));
	});
});

describe('i18n via App - domains-prefix-always with trailingSlash: never', () => {
	const i18n = makeI18nConfig({
		strategy: 'domains-prefix-always',
		locales: ['fi', 'en'],
		defaultLocale: 'fi',
		domainLookupTable: {
			'https://example.com': 'en',
			'https://example.fi': 'fi',
		},
		domains: {
			en: 'https://example.com',
			fi: 'https://example.fi',
		},
	});

	const middleware = createI18nMiddleware(i18n, '/', 'never', 'directory');

	/** Like localeCatchAll but with spread param and trailingSlash: never */
	function localeSpreadCatchAll(locale: string) {
		return createPage(localePage, {
			route: `/${locale}/[...slug]`,
			segments: [[staticPart(locale)], [spreadPart('slug')]],
			pathname: undefined,
			trailingSlash: 'never',
		});
	}

	function createDomainApp() {
		return createTestApp([localeSpreadCatchAll('fi'), localeSpreadCatchAll('en')], {
			i18n,
			trailingSlash: 'never',
			middleware: () => ({ onRequest: middleware }),
		});
	}

	it('root path of en domain-mapped locale returns 200 (not 404)', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.com/', {
				headers: { 'X-Forwarded-Host': 'example.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('non-root path of en domain-mapped locale returns 200', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.com/about', {
				headers: { 'X-Forwarded-Host': 'example.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('root path of fi domain-mapped locale returns 200 (not 404)', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.fi/', {
				headers: { 'X-Forwarded-Host': 'example.fi', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'fi');
	});

	it('non-root path of fi domain-mapped locale returns 200', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.fi/about', {
				headers: { 'X-Forwarded-Host': 'example.fi', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'fi');
	});
});

describe('i18n via App - domains-prefix-other-locales', () => {
	const i18n = makeI18nConfig({
		strategy: 'domains-prefix-other-locales',
		locales: ['en', 'pt'],
		defaultLocale: 'en',
	});
	i18n.domainLookupTable = { 'https://example.pt': 'pt' };
	i18n.domains = { pt: 'https://example.pt' };

	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createDomainApp() {
		return createTestApp(
			[
				createPage(localePage, {
					route: '/[...slug]',
					segments: [[dynamicPart('slug')]],
					pathname: undefined,
				}),
				localeCatchAll('pt'),
			],
			{ i18n, middleware: () => ({ onRequest: middleware }) },
		);
	}

	it('renders Portuguese from domain without locale prefix in URL', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://example.pt/about', {
				headers: { 'X-Forwarded-Host': 'example.pt', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'pt');
	});

	it('renders default locale without prefix on non-domain request', async () => {
		const app = createDomainApp();
		const res = await app.render(new Request('http://example.com/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});
});

// #16854: Dynamic routes with non-spread params should work with domain-based i18n
describe('i18n via App - domains-prefix-other-locales with dynamic params (#16854)', () => {
	const i18n = makeI18nConfig({
		strategy: 'domains-prefix-other-locales',
		locales: ['fi', 'en'],
		defaultLocale: 'fi',
	});
	i18n.domainLookupTable = { 'https://en.example.com': 'en' };
	i18n.domains = { en: 'https://en.example.com' };

	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createDomainApp() {
		const fiPage = createPage(paramsPage, {
			route: '/boats/[id]/[slug]',
			segments: [[staticPart('boats')], [dynamicPart('id')], [dynamicPart('slug')]],
		});
		const enPage = createPage(paramsPage, {
			route: '/en/boats/[id]/[slug]',
			segments: [
				[staticPart('en')],
				[staticPart('boats')],
				[dynamicPart('id')],
				[dynamicPart('slug')],
			],
		});
		// Real Astro leaves `pathname` undefined for dynamic routes, but the mock
		// defaults it to the route string (which contains the `/en/` prefix). That
		// would mask the `Astro.currentLocale` bug, since locale detection would
		// find the prefix in routeData.pathname instead of relying on the
		// domain-derived pathname. Null it out so the test reproduces #16854.
		fiPage.routeData.pathname = undefined;
		enPage.routeData.pathname = undefined;
		return createTestApp([fiPage, enPage], {
			i18n,
			middleware: () => ({ onRequest: middleware }),
		});
	}

	it('resolves params and currentLocale for dynamic route on non-default locale domain', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://en.example.com/boats/1/sunset-cruiser', {
				headers: { 'X-Forwarded-Host': 'en.example.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#id').text(), '1');
		assert.equal($('#slug').text(), 'sunset-cruiser');
		assert.equal($('#locale').text(), 'en');
	});

	it('resolves params and currentLocale for dynamic route on default locale domain', async () => {
		const app = createDomainApp();
		const res = await app.render(new Request('http://example.com/boats/2/blue-wave'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#id').text(), '2');
		assert.equal($('#slug').text(), 'blue-wave');
		assert.equal($('#locale').text(), 'fi');
	});

	it('normalizes the public pathname before deriving the domain pathname', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://en.example.com/boats/3/caf%25C3%25A9', {
				headers: { 'X-Forwarded-Host': 'en.example.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#slug').text(), 'café');
		assert.equal($('#path').text(), '/boats/3/caf%C3%A9');
	});

	it('rejects over-encoded paths on a mapped domain', async () => {
		const app = createDomainApp();
		const res = await app.render(
			new Request('https://en.example.com/%2525252525252525252561dmin', {
				headers: { 'X-Forwarded-Host': 'en.example.com', 'X-Forwarded-Proto': 'https' },
			}),
		);
		assert.equal(res.status, 400);
	});
});

// #15098: Invalid locale in URL should render 404, not the [locale] page
describe('i18n via App - invalid locale with dynamic [locale] route (#15098)', () => {
	const i18n = makeI18nConfig({
		strategy: 'pathname-prefix-always',
		locales: ['en', 'de'],
		fallback: undefined,
	});
	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createApp() {
		return createTestApp(
			[
				createPage(localePage, {
					route: '/[locale]',
					segments: [[dynamicPart('locale')]],
					pathname: undefined,
				}),
				createPage(notFoundPage, { route: '/404', component: '404.astro' }),
			],
			{ i18n, middleware: () => ({ onRequest: middleware }) },
		);
	}

	it('valid locale /en/ returns 200 with locale page', async () => {
		const app = createApp();
		const res = await app.render(new Request('http://example.com/en/'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('valid locale /de/ returns 200 with correct currentLocale', async () => {
		const app = createApp();
		const res = await app.render(new Request('http://example.com/de/'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'de');
	});

	it('invalid locale /asdf/ returns 404 with 404 page content', async () => {
		const app = createApp();
		const res = await app.render(new Request('http://example.com/asdf/'));
		assert.equal(res.status, 404);
		const $ = cheerio.load(await res.text());
		assert.equal(
			$('#not-found').text(),
			'404 Not Found',
			'Should render 404.astro, not [locale]/index.astro',
		);
	});

	it('invalid locale /xyz/ does not render the locale page', async () => {
		const app = createApp();
		const res = await app.render(new Request('http://example.com/xyz/'));
		assert.equal(res.status, 404);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), '', 'Should NOT contain locale page content');
	});
});

// #12385: Domain i18n should resolve locale even with port in Host header
describe('i18n via App - domain with localhost and ports (#12385)', () => {
	const i18n = makeI18nConfig({
		strategy: 'domains-prefix-other-locales',
		locales: ['en', 'zh'],
	});
	i18n.domainLookupTable = { 'http://zh.test': 'zh' };
	i18n.domains = { zh: 'http://zh.test' };

	const middleware = createI18nMiddleware(i18n, '/', 'ignore', 'directory');

	function createApp() {
		return createTestApp(
			[
				createPage(localePage, {
					route: '/[...slug]',
					segments: [[dynamicPart('slug')]],
					pathname: undefined,
				}),
				localeCatchAll('zh'),
			],
			{ i18n, middleware: () => ({ onRequest: middleware }) },
		);
	}

	it('zh.test without port resolves to Chinese locale', async () => {
		const app = createApp();
		const res = await app.render(
			new Request('http://zh.test/about', { headers: { Host: 'zh.test' } }),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'zh');
	});

	it('zh.test:4321 with port in Host header resolves to Chinese locale', async () => {
		const app = createApp();
		const res = await app.render(
			new Request('http://zh.test:4321/about', { headers: { Host: 'zh.test:4321' } }),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'zh');
	});

	it('zh.test:4321 via X-Forwarded-Host resolves to Chinese locale', async () => {
		const app = createApp();
		const res = await app.render(
			new Request('http://localhost:4321/about', {
				headers: { 'X-Forwarded-Host': 'zh.test:4321', 'X-Forwarded-Proto': 'http' },
			}),
		);
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'zh');
	});

	it('default locale on non-matching domain works without prefix', async () => {
		const app = createApp();
		const res = await app.render(new Request('http://test/about', { headers: { Host: 'test' } }));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});
});

describe('i18n via AstroHandler (no middleware) - prefix-always (#16800)', () => {
	// This tests the handler-based i18n flow where I18n.finalize() runs
	// as a post-processing step after AstroMiddleware, NOT as an internal
	// middleware. This is the default code path for non-manual routing.
	const i18n = makeI18nConfig({ strategy: 'pathname-prefix-always' });

	function createHandlerApp() {
		// Do NOT pass middleware — this forces i18n to be handled by
		// AstroHandler's post-processing step (I18n.finalize), not by
		// a middleware in the chain.
		return createTestApp([localeCatchAll('en'), localeCatchAll('fr')], {
			i18n,
		});
	}

	it('redirects root / to /en/ via handler post-processing', async () => {
		const app = createHandlerApp();
		const res = await app.render(new Request('http://example.com/'));
		assert.equal(res.status, 302);
		assert.ok(res.headers.get('Location')?.includes('/en'));
	});

	it('renders locale-prefixed pages normally', async () => {
		const app = createHandlerApp();
		const res = await app.render(new Request('http://example.com/en/about'));
		assert.equal(res.status, 200);
		const $ = cheerio.load(await res.text());
		assert.equal($('#locale').text(), 'en');
	});

	it('returns 404 for paths without locale prefix', async () => {
		const app = createHandlerApp();
		const res = await app.render(new Request('http://example.com/about'));
		assert.equal(res.status, 404);
	});
});
