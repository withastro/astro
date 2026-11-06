import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchRoute } from '../../../dist/core/routing/dev.js';
import { makeRoute, spreadPart, staticPart } from './test-helpers.ts';
import { defaultLogger } from '../test-utils.ts';
import { setEnvironment } from '../../../dist/core/environment/index.js';
import { productionEnvironment } from '../../../dist/core/environment/production.js';
import { setLogger } from '../../../dist/core/logger/manifest-logger.js';
import { updateRouteTable } from '../../../dist/core/routing/route-table.js';

import type { RouteData } from '../../../dist/types/public/index.js';
import type { SSRManifest } from '../../../dist/core/app/types.js';

/**
 * Creates a minimal mock manifest for testing matchRoute, registering a
 * matching environment/logger and installing the given routes into the
 * per-manifest route table — `matchRoute` reads all of them through the
 * manifest registries.
 * `componentLoaders` maps route component paths to functions producing their
 * module exports; a loader that throws simulates a module that cannot be
 * imported in the current environment (e.g. `cloudflare:workers` in Node).
 * `loadedComponents` records every component whose module was requested.
 */
function createMockManifest(
	componentLoaders: Record<string, () => any>,
	routes: RouteData[],
	logger = defaultLogger,
) {
	const loadedComponents: string[] = [];
	const manifest = {
		serverLike: false,
		base: '/',
		trailingSlash: 'ignore',
		rootDir: new URL('file:///fake/'),
		routes: [],
		buildClientDir: new URL('file:///fake/client/'),
		outDir: new URL('file:///fake/'),
	} as unknown as SSRManifest;
	setLogger(manifest, logger);
	setEnvironment(manifest, {
		...productionEnvironment,
		name: 'test-dev',
		runtimeMode: 'development',
		async getComponentByRoute(_manifest, route: RouteData) {
			loadedComponents.push(route.component);
			return componentLoaders[route.component]();
		},
	});
	updateRouteTable(manifest, routes);
	return { manifest, loadedComponents };
}

const trailingSlash = 'ignore';

// A non-prerendered endpoint whose module only loads in a specific runtime,
// like @astrojs/cloudflare's /_image endpoint importing `cloudflare:workers`.
const ssrImageEndpoint = makeRoute({
	segments: [[staticPart('_image')]],
	trailingSlash,
	route: '/_image',
	pathname: '/_image',
	type: 'endpoint',
	component: '@astrojs/cloudflare/image-transform-endpoint',
	prerender: false,
	origin: 'external',
});

const prerenderedCatchAll = makeRoute({
	segments: [[spreadPart('...slug')]],
	trailingSlash,
	route: '/[...slug]',
	pathname: undefined,
	component: 'src/pages/[...slug].astro',
	prerender: true,
});

const prerendered404 = makeRoute({
	segments: [[staticPart('404')]],
	trailingSlash,
	route: '/404',
	pathname: '/404',
	component: 'src/pages/404.astro',
	prerender: true,
});

const runtimeOnlyModule = () => {
	throw new Error("Cannot import 'cloudflare:workers' outside the workerd runtime");
};

describe('matchRoute with prerenderOnly', () => {
	// Regression test for #17348: a prerendered catch-all makes the dev
	// prerender gate route /_image through the Node prerender handler, which
	// previously imported the endpoint's module there and crashed.
	it('skips non-prerendered routes without importing their components', async () => {
		const { manifest, loadedComponents } = createMockManifest(
			{
				'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
				'src/pages/[...slug].astro': () => ({
					getStaticPaths: () => [{ params: { slug: 'blog' } }],
				}),
			},
			[ssrImageEndpoint, prerenderedCatchAll],
		);

		const result = await matchRoute(manifest, '/_image', {
			prerenderOnly: true,
		});

		assert.equal(result, undefined, 'Expected no match so the SSR handler takes over');
		assert.ok(
			!loadedComponents.includes('@astrojs/cloudflare/image-transform-endpoint'),
			'Expected the non-prerendered component to never be imported',
		);
	});

	it('still imports non-prerendered components without prerenderOnly', async () => {
		const { manifest } = createMockManifest(
			{
				'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
				'src/pages/[...slug].astro': () => ({
					getStaticPaths: () => [{ params: { slug: 'blog' } }],
				}),
			},
			[ssrImageEndpoint, prerenderedCatchAll],
		);

		await assert.rejects(() => matchRoute(manifest, '/_image'), /cloudflare:workers/);
	});

	it('keeps filtering through the .html alt-pathname retry', async () => {
		const ssrEndpoint = makeRoute({
			segments: [[staticPart('foo')]],
			trailingSlash,
			route: '/foo',
			pathname: '/foo',
			type: 'endpoint',
			component: 'src/pages/foo.ts',
			prerender: false,
		});

		const { manifest, loadedComponents } = createMockManifest(
			{
				'src/pages/foo.ts': runtimeOnlyModule,
				'src/pages/[...slug].astro': () => ({
					getStaticPaths: () => [{ params: { slug: 'bar' } }],
				}),
			},
			[ssrEndpoint, prerenderedCatchAll],
		);

		// '/foo.html' matches no candidate, so matchRoute retries with '/foo',
		// which must keep skipping the non-prerendered endpoint.
		const result = await matchRoute(manifest, '/foo.html', {
			prerenderOnly: true,
		});

		assert.equal(result, undefined, 'Expected no match so the SSR handler takes over');
		assert.ok(
			!loadedComponents.includes('src/pages/foo.ts'),
			'Expected the non-prerendered component to never be imported on the retry',
		);
	});

	// A prerendered custom 404 must not shadow the skipped SSR route: the
	// prerender handler would render a 404 for /_image instead of letting the
	// SSR handler serve it.
	it('does not fall back to a prerendered 404 when candidates were skipped', async () => {
		const { manifest, loadedComponents } = createMockManifest(
			{
				'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
				'src/pages/[...slug].astro': () => ({
					getStaticPaths: () => [{ params: { slug: 'blog' } }],
				}),
			},
			[ssrImageEndpoint, prerenderedCatchAll, prerendered404],
		);

		const result = await matchRoute(manifest, '/_image', {
			prerenderOnly: true,
		});

		assert.equal(result, undefined, 'Expected no match so the SSR handler takes over');
		assert.ok(
			!loadedComponents.includes('@astrojs/cloudflare/image-transform-endpoint'),
			'Expected the non-prerendered component to never be imported',
		);
	});

	it('still falls back to the 404 when nothing was skipped', async () => {
		const { manifest } = createMockManifest(
			{
				'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
			},
			[ssrImageEndpoint, prerendered404],
		);

		const result = await matchRoute(manifest, '/nope', {
			prerenderOnly: true,
		});

		assert.ok(result, 'Expected the 404 fallback for a genuinely unmatched path');
		assert.equal(result.route.route, '/404');
	});

	it('does not log NoMatchingStaticPathFound when candidates were skipped', async () => {
		const warnings: string[] = [];
		const spyLogger = {
			warn: (_label: string | null, message: string) => {
				warnings.push(message);
			},
			error: () => {},
			info: () => {},
			debug: () => {},
		} as unknown as typeof defaultLogger;

		const { manifest } = createMockManifest(
			{
				'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
				'src/pages/[...slug].astro': () => ({
					getStaticPaths: () => [{ params: { slug: 'blog' } }],
				}),
			},
			[ssrImageEndpoint, prerenderedCatchAll],
			spyLogger,
		);

		await matchRoute(manifest, '/_image', {
			prerenderOnly: true,
		});

		assert.deepEqual(warnings, [], 'Expected no router warning for skipped SSR candidates');
	});

	it('returns prerendered matches as usual', async () => {
		const { manifest } = createMockManifest(
			{
				'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
				'src/pages/[...slug].astro': () => ({
					getStaticPaths: () => [{ params: { slug: 'blog' } }],
				}),
			},
			[ssrImageEndpoint, prerenderedCatchAll],
		);

		const result = await matchRoute(manifest, '/blog', {
			prerenderOnly: true,
		});

		assert.ok(result, 'Expected the prerendered catch-all to match');
		assert.equal(result.route.component, 'src/pages/[...slug].astro');
	});
});
