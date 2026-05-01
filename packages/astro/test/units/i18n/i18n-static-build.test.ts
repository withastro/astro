import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import type { StaticBuildOptions } from '../../../dist/core/build/types.js';
import { renderPath } from '../../../dist/core/build/generate.js';
import { createMockPrerenderer, createStaticBuildOptions } from '../build/test-helpers.ts';
import { createMockAstroSource, createRouteData } from '../mocks.ts';

// Page sources — mirrors the structure of the deleted fixture.
// createStaticBuildOptions writes these into a temp directory and derives
// routesList from them using the same config, so routes and settings are in sync.
const pages: Record<string, string> = {
	'src/pages/index.astro': createMockAstroSource('<body><h1>Index</h1></body>'),
	'src/pages/es/test/item1.astro': createMockAstroSource('<body><h1>Test Item 1 (ES)</h1></body>'),
	'src/pages/test/item1.astro': createMockAstroSource('<body><h1>Test Item 1 (EN)</h1></body>'),
	'src/pages/test/item2.astro': createMockAstroSource(
		'<body><h1>Test Item 2 (EN only)</h1></body>',
	),
};

const prerenderer = createMockPrerenderer({
	'/es/test/item1': '<html><body><h1>Test Item 1 (ES)</h1></body></html>',
	'/test/item1': '<html><body><h1>Test Item 1 (EN)</h1></body></html>',
	'/test/item2': '<html><body><h1>Test Item 2 (EN only)</h1></body></html>',
});

// A single shared options object is sufficient — none of these tests inspect the
// written files; they only assert on the `result` returned by renderPath().
let sharedOpts: StaticBuildOptions;

describe('i18n double-prefix prevention', () => {
	before(async () => {
		sharedOpts = await createStaticBuildOptions({
			pages,
			inlineConfig: {
				i18n: {
					defaultLocale: 'en',
					locales: ['en', { path: 'es', codes: ['es', 'es-ES', 'es-MX'] }],
					routing: { prefixDefaultLocale: false },
					fallback: { es: 'en' },
				},
			},
		});
	});
	it('should not create double-prefixed redirect pages', async () => {
		// The Spanish page exists as a real route in routesList
		const esRoute = sharedOpts.routesList.routes.find(
			(r) => r.route === '/es/test/item1' && r.type === 'page',
		);
		assert.ok(esRoute, 'expected a real ES page route in routesList');

		const esResult = await renderPath({
			prerenderer,
			pathname: '/es/test/item1',
			route: esRoute,
			options: sharedOpts,
			logger: sharedOpts.logger,
		});
		assert.ok(esResult !== null);
		assert.ok(esResult.body.toString().includes('<h1>Test Item 1 (ES)</h1>'));

		// Double-prefixed path should NOT exist.
		// createStaticBuildOptions already prevents generating a fallback for /es/test/item1
		// because the real ES page exists. renderPath provides a secondary safety net: if a
		// fallback route were somehow passed for a pathname that already has a real page in
		// routesList, it must return null (suppressed).
		const fallbackEsItem1Route = createRouteData({ route: '/es/test/item1', type: 'fallback' });
		const fallbackResult = await renderPath({
			prerenderer,
			pathname: '/es/test/item1',
			route: fallbackEsItem1Route,
			options: sharedOpts,
			logger: sharedOpts.logger,
		});
		assert.equal(
			fallbackResult,
			null,
			'Double-prefixed path /es/es/test/item1/index.html should not exist',
		);

		// The English page should be unaffected
		const enRoute = sharedOpts.routesList.routes.find((r) => r.route === '/test/item1');
		assert.ok(enRoute);
		const enResult = await renderPath({
			prerenderer,
			pathname: '/test/item1',
			route: enRoute,
			options: sharedOpts,
			logger: sharedOpts.logger,
		});
		assert.ok(enResult !== null);
		assert.ok(enResult.body.toString().includes('<h1>Test Item 1 (EN)</h1>'));
	});

	it('should generate correct fallback redirects for missing Spanish pages', async () => {
		// item2 only exists in English — createStaticBuildOptions generates a fallback for /es/test/item2
		const enItem2Route = sharedOpts.routesList.routes.find((r) => r.route === '/test/item2');
		const fallbackEsItem2Route = enItem2Route?.fallbackRoutes.find(
			(r) => r.route === '/es/test/item2',
		);
		assert.ok(
			fallbackEsItem2Route,
			'expected routesList to contain a fallback route for /es/test/item2',
		);

		const prerendererWithFallback = createMockPrerenderer({
			'/es/test/item2': '<html><body><h1>Test Item 2 (EN only)</h1></body></html>',
		});

		const result = await renderPath({
			prerenderer: prerendererWithFallback,
			pathname: '/es/test/item2',
			route: fallbackEsItem2Route,
			options: sharedOpts,
			logger: sharedOpts.logger,
		});

		// The Spanish fallback was generated — verify it would not be double-prefixed
		assert.ok(result !== null);
		assert.ok(result.body.toString().includes('<h1>Test Item 2 (EN only)</h1>'));
		assert.equal(
			result.outFile.pathname.includes('/es/es/'),
			false,
			'Double-prefixed path /es/es/test/item2/index.html should not exist',
		);
	});
});
