import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import type { StaticBuildOptions } from '../../../dist/core/build/types.js';
import { renderPath } from '../../../dist/core/build/generate.js';
import { createMockAstroSource, createRouteData } from '../mocks.ts';
import { createMockPrerenderer, createStaticBuildOptions } from '../build/test-helpers.ts';

async function renderAndAssertPath(
	prerenderer: ReturnType<typeof createMockPrerenderer>,
	pathname: string,
	route: Parameters<typeof renderPath>[0]['route'],
	options: StaticBuildOptions,
	expectedPathSuffix: string,
) {
	const result = await renderPath({
		prerenderer,
		pathname,
		route,
		options,
		logger: options.logger,
	});
	assert.ok(result !== null, `expected a result for ${pathname}`);
	assert.ok(
		result.outFile.pathname.endsWith(expectedPathSuffix),
		`expected outFile to end with ${expectedPathSuffix}, got ${result.outFile.pathname}`,
	);
	return result;
}

describe('[SSG] i18n routing — prefix-always', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/index.astro': createMockAstroSource('<p>I am index</p>'),
		'src/pages/404.astro': createMockAstroSource("<p>Can't find the page you're looking for.</p>"),
		'src/pages/500.astro': createMockAstroSource('<p>Unexpected error.</p>'),
		'src/pages/en/start.astro': createMockAstroSource('<p>Start</p>'),
		'src/pages/pt/start.astro': createMockAstroSource('<p>Oi essa e start</p>'),
		'src/pages/spanish/start.astro': createMockAstroSource('<p>Espanol</p>'),
	};

	const prerenderer = createMockPrerenderer({
		'/en/start': '<html><body><p>Start</p></body></html>',
		'/pt/start': '<html><body><p>Oi essa e start</p></body></html>',
		'/spanish/start': '<html><body><p>Espanol</p></body></html>',
	});

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				base: '/new-site',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'pt', { path: 'spanish', codes: ['es', 'es-ar'] }],
					routing: { prefixDefaultLocale: true, redirectToDefaultLocale: true },
				},
			},
		});
	});

	it('renders English start page at /en/start/', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/en/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/en/start',
			route,
			options,
			'/en/start/index.html',
		);
		assert.ok(result.body.toString().includes('Start'));
	});

	it('renders Portuguese start page at /pt/start/', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/pt/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/pt/start',
			route,
			options,
			'/pt/start/index.html',
		);
		assert.ok(result.body.toString().includes('Oi essa e start'));
	});

	it('renders Spanish start page at /spanish/start/', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/spanish/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/spanish/start',
			route,
			options,
			'/spanish/start/index.html',
		);
		assert.ok(result.body.toString().includes('Espanol'));
	});

	it('does not write /it/start (no Italian pages)', async () => {
		const result = await renderPath({
			prerenderer: createMockPrerenderer({ '/it/start': new Response(null, { status: 404 }) }),
			pathname: '/it/start',
			route: createRouteData({ route: '/it/start', type: 'page' }),
			options,
			logger: options.logger,
		});
		assert.equal(result, null);
	});
});

describe('[SSG] i18n routing — prefix-other-locales', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/start.astro': createMockAstroSource('<p>Start</p>'),
		'src/pages/pt/start.astro': createMockAstroSource('<p>Oi essa e start</p>'),
	};

	const prerenderer = createMockPrerenderer({
		'/start': '<html><body><p>Start</p></body></html>',
		'/pt/start': '<html><body><p>Oi essa e start</p></body></html>',
	});

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				base: '/new-site',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'pt', 'it'],
					routing: { prefixDefaultLocale: false },
				},
			},
		});
	});

	it('renders default locale (en) at root /start/', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/start',
			route,
			options,
			'/start/index.html',
		);
		assert.ok(result.body.toString().includes('Start'));
	});

	it('renders Portuguese start page at /pt/start/', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/pt/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/pt/start',
			route,
			options,
			'/pt/start/index.html',
		);
		assert.ok(result.body.toString().includes('Oi essa e start'));
	});

	it('does not create an /en/start route (default locale has no prefix)', () => {
		const enStartRoute = options.routesList.routes.find((r) => r.route === '/en/start');
		assert.equal(enStartRoute, undefined);
	});
});

describe('[SSG] i18n routing — pathname-prefix-always, no redirect to default locale', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/index.astro': createMockAstroSource('<p>I am index</p>'),
	};

	const prerenderer = createMockPrerenderer({
		'/': '<html><body><p>I am index</p></body></html>',
	});

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				base: '/new-site',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'pt'],
					routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
				},
			},
		});
	});

	it('renders / with page content, not a redirect', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/');
		assert.ok(route);
		const result = await renderAndAssertPath(prerenderer, '/', route, options, '/index.html');
		assert.ok(result.body.toString().includes('I am index'));
	});
});

describe('[SSG] i18n routing — fallback (it → en, spanish → en)', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/start.astro': createMockAstroSource('<p>Start</p>'),
		'src/pages/pt/start.astro': createMockAstroSource('<p>Oi essa e start: pt</p>'),
	};

	const prerenderer = createMockPrerenderer({
		'/start': '<html><body><p>Start</p></body></html>',
		'/pt/start': '<html><body><p>Oi essa e start: pt</p></body></html>',
	});

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				base: 'new-site',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'pt', 'it', { path: 'spanish', codes: ['es', 'es-AR'] }],
					routing: { prefixDefaultLocale: false },
					fallback: { it: 'en', spanish: 'en' },
				},
			},
		});
	});

	it('renders /start/ in English', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/start',
			route,
			options,
			'/start/index.html',
		);
		assert.ok(result.body.toString().includes('Start'));
	});

	it('renders /pt/start/ in Portuguese', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/pt/start');
		assert.ok(route);
		const result = await renderAndAssertPath(
			prerenderer,
			'/pt/start',
			route,
			options,
			'/pt/start/index.html',
		);
		assert.ok(result.body.toString().includes('Oi essa e start'));
	});

	it('renders /spanish/start/ as a redirect to /start (fallback)', async () => {
		const startRoute = options.routesList.routes.find((r) => r.route === '/start');
		const fallbackRoute = startRoute?.fallbackRoutes.find((r) => r.route === '/spanish/start');
		assert.ok(fallbackRoute, 'expected fallback route for /spanish/start');

		const result = await renderPath({
			prerenderer: createMockPrerenderer({
				'/spanish/start': new Response(null, {
					status: 302,
					headers: { location: '/new-site/start' },
				}),
			}),
			pathname: '/spanish/start',
			route: fallbackRoute,
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('/new-site/start'));
	});

	it('renders /it/start/ as a redirect to /start (fallback)', async () => {
		const startRoute = options.routesList.routes.find((r) => r.route === '/start');
		const fallbackRoute = startRoute?.fallbackRoutes.find((r) => r.route === '/it/start');
		assert.ok(fallbackRoute, 'expected fallback route for /it/start');

		const result = await renderPath({
			prerenderer: createMockPrerenderer({
				'/it/start': new Response(null, { status: 302, headers: { location: '/new-site/start' } }),
			}),
			pathname: '/it/start',
			route: fallbackRoute,
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('http-equiv="refresh"'));
		assert.ok(result.body.toString().includes('/new-site/start'));
	});

	it('does not write /fr/start (no French locale or fallback)', async () => {
		const result = await renderPath({
			prerenderer: createMockPrerenderer({ '/fr/start': new Response(null, { status: 404 }) }),
			pathname: '/fr/start',
			route: createRouteData({ route: '/fr/start', type: 'page' }),
			options,
			logger: options.logger,
		});
		assert.equal(result, null);
	});
});

describe('[SSG] i18n routing — fallback with prefix-always (it → en)', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/en/start.astro': createMockAstroSource('<p>Start</p>'),
	};

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				base: '/new-site',
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'pt', 'it'],
					routing: { prefixDefaultLocale: true },
					fallback: { it: 'en' },
				},
			},
		});
	});

	it('renders /it/start/ as a redirect to /new-site/en/start (fallback)', async () => {
		const enRoute = options.routesList.routes.find((r) => r.route === '/en/start');
		const fallbackRoute = enRoute?.fallbackRoutes.find((r) => r.route === '/it/start');
		assert.ok(fallbackRoute, 'expected fallback route for /it/start');

		const result = await renderPath({
			prerenderer: createMockPrerenderer({
				'/it/start': new Response(null, {
					status: 302,
					headers: { location: '/new-site/en/start' },
				}),
			}),
			pathname: '/it/start',
			route: fallbackRoute,
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('/new-site/en/start'));
	});
});

describe('[SSG] i18n routing — fallback rewrite with dynamic routes (es → en)', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/index.astro': createMockAstroSource('<span id="page">Index</span>'),
		'src/pages/test.astro': createMockAstroSource('<span id="test">test</span>'),
	};

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'es'],
					routing: { fallbackType: 'rewrite', prefixDefaultLocale: false },
					fallback: { es: 'en' },
				},
			},
		});
	});

	it('renders /es/slug-1 via fallback rewrite', async () => {
		const result = await renderPath({
			prerenderer: createMockPrerenderer({
				'/es/slug-1': '<html><body><span id="page">slug-1</span></body></html>',
			}),
			pathname: '/es/slug-1',
			route: createRouteData({ route: '/es/slug-1', type: 'fallback' }),
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('slug-1'));
	});

	it('renders /es/page-1 via fallback rewrite', async () => {
		const result = await renderPath({
			prerenderer: createMockPrerenderer({
				'/es/page-1': '<html><body><span id="page">page-1</span></body></html>',
			}),
			pathname: '/es/page-1',
			route: createRouteData({ route: '/es/page-1', type: 'fallback' }),
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('page-1'));
	});

	it('renders /es/test via fallback rewrite', async () => {
		const testRoute = options.routesList.routes.find((r) => r.route === '/test');
		const fallbackRoute = testRoute?.fallbackRoutes.find((r) => r.route === '/es/test');
		assert.ok(fallbackRoute, 'expected fallback route for /es/test');

		const result = await renderPath({
			prerenderer: createMockPrerenderer({
				'/es/test': '<html><body><span id="test">test</span></body></html>',
			}),
			pathname: '/es/test',
			route: fallbackRoute,
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('test'));
	});
});

describe('[SSG] i18n routing — fallback rewrite with locale-like filenames (de → en)', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/index.astro': createMockAstroSource('<span id="page">Index</span>'),
		'src/pages/denmark.astro': createMockAstroSource('<span id="page">Denmark</span>'),
		'src/pages/norway.astro': createMockAstroSource('<span id="page">Norway</span>'),
		'src/pages/destinations/index.astro': createMockAstroSource(
			'<span id="page">Destination: Index</span>',
		),
		'src/pages/destinations/denmark.astro': createMockAstroSource(
			'<span id="page">Destination: Denmark</span>',
		),
		'src/pages/destinations/norway.astro': createMockAstroSource(
			'<span id="page">Destination: Norway</span>',
		),
		'src/pages/trade/index.astro': createMockAstroSource('<span id="page">Trade: Index</span>'),
		'src/pages/trade/denmark.astro': createMockAstroSource('<span id="page">Trade: Denmark</span>'),
		'src/pages/trade/norway.astro': createMockAstroSource('<span id="page">Trade: Norway</span>'),
	};

	const prerenderer = createMockPrerenderer({
		'/': '<html><body><span id="page">Index</span></body></html>',
		'/norway': '<html><body><span id="page">Norway</span></body></html>',
		'/denmark': '<html><body><span id="page">Denmark</span></body></html>',
		'/destinations': '<html><body><span id="page">Destination: Index</span></body></html>',
		'/destinations/denmark':
			'<html><body><span id="page">Destination: Denmark</span></body></html>',
		'/destinations/norway': '<html><body><span id="page">Destination: Norway</span></body></html>',
		'/trade': '<html><body><span id="page">Trade: Index</span></body></html>',
		'/trade/denmark': '<html><body><span id="page">Trade: Denmark</span></body></html>',
		'/trade/norway': '<html><body><span id="page">Trade: Norway</span></body></html>',
		'/de/norway': '<html><body><span id="page">Norway</span></body></html>',
		'/de/denmark': '<html><body><span id="page">Denmark</span></body></html>',
		'/de/destinations/denmark':
			'<html><body><span id="page">Destination: Denmark</span></body></html>',
		'/de/destinations/norway':
			'<html><body><span id="page">Destination: Norway</span></body></html>',
		'/de/trade/denmark': '<html><body><span id="page">Trade: Denmark</span></body></html>',
		'/de/trade/norway': '<html><body><span id="page">Trade: Norway</span></body></html>',
	});

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', 'de'],
					routing: { fallbackType: 'rewrite', prefixDefaultLocale: false },
					fallback: { de: 'en' },
				},
			},
		});
	});

	for (const [en, de, expected] of [
		['/norway', '/de/norway', 'Norway'],
		['/denmark', '/de/denmark', 'Denmark'],
		['/destinations/denmark', '/de/destinations/denmark', 'Destination: Denmark'],
		['/destinations/norway', '/de/destinations/norway', 'Destination: Norway'],
		['/trade/denmark', '/de/trade/denmark', 'Trade: Denmark'],
		['/trade/norway', '/de/trade/norway', 'Trade: Norway'],
	] as const) {
		it(`renders ${en} (EN)`, async () => {
			const route = options.routesList.routes.find((r) => r.route === en);
			assert.ok(route, `expected route ${en}`);
			const result = await renderPath({
				prerenderer,
				pathname: en,
				route,
				options,
				logger: options.logger,
			});
			assert.ok(result !== null);
			assert.ok(result.body.toString().includes(expected));
		});

		it(`renders ${de} via fallback rewrite`, async () => {
			const enRoute = options.routesList.routes.find((r) => r.route === en);
			const fallbackRoute = enRoute?.fallbackRoutes.find((r) => r.route === de);
			assert.ok(fallbackRoute, `expected fallback route ${de}`);
			const result = await renderPath({
				prerenderer,
				pathname: de,
				route: fallbackRoute,
				options,
				logger: options.logger,
			});
			assert.ok(result !== null);
			assert.ok(result.body.toString().includes(expected));
		});
	}
});

describe('[SSG] i18n routing — page starting with locale-like segment', () => {
	let options: StaticBuildOptions;

	const pages: Record<string, string> = {
		'src/pages/endurance.astro': createMockAstroSource('<p>Endurance</p>'),
	};

	const prerenderer = createMockPrerenderer({
		'/endurance': '<html><body><p>Endurance</p></body></html>',
	});

	before(async () => {
		options = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				i18n: {
					defaultLocale: 'spanish',
					locales: ['en', 'pt', 'it', { path: 'spanish', codes: ['es', 'es-SP'] }],
					routing: { prefixDefaultLocale: false },
				},
			},
		});
	});

	it('renders /endurance/ (not treated as a locale prefix)', async () => {
		const route = options.routesList.routes.find((r) => r.route === '/endurance');
		assert.ok(route);
		const result = await renderPath({
			prerenderer,
			pathname: '/endurance',
			route,
			options,
			logger: options.logger,
		});
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('Endurance'));
	});
});
