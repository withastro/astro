import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchRoute } from '../../../dist/core/routing/dev.js';
import { makeRoute, spreadPart, staticPart } from './test-helpers.ts';
import { defaultLogger } from '../test-utils.ts';
import { RouteCache } from '../../../dist/core/render/route-cache.js';

import type { RunnablePipeline } from '../../../dist/vite-plugin-app/pipeline.js';
import type { RouteData } from '../../../dist/types/public/index.js';
import type { SSRManifest } from '../../../dist/core/app/types.js';

/**
 * Creates a minimal mock pipeline and manifest for testing matchRoute.
 * `componentLoaders` maps route component paths to functions producing their
 * module exports; a loader that throws simulates a module that cannot be
 * imported in the current environment (e.g. `cloudflare:workers` in Node).
 * `loadedComponents` records every component whose module was requested.
 */
function createMockPipelineAndManifest(componentLoaders: Record<string, () => any>) {
	const loadedComponents: string[] = [];
	const routeCache = new RouteCache(defaultLogger);
	const manifest = {
		serverLike: false,
		base: '/',
		trailingSlash: 'ignore',
		rootDir: new URL('file:///fake/'),
		routes: [],
		buildClientDir: new URL('file:///fake/client/'),
		outDir: new URL('file:///fake/'),
	} as unknown as SSRManifest;
	const pipeline = {
		logger: defaultLogger,
		routeCache,
		manifest,
		getComponentByRoute(route: RouteData) {
			loadedComponents.push(route.component);
			return componentLoaders[route.component]();
		},
	} as unknown as RunnablePipeline;
	return { pipeline, manifest, loadedComponents };
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

const runtimeOnlyModule = () => {
	throw new Error("Cannot import 'cloudflare:workers' outside the workerd runtime");
};

describe('matchRoute with prerenderOnly', () => {
	// Regression test for #17348: a prerendered catch-all makes the dev
	// prerender gate route /_image through the Node prerender handler, which
	// previously imported the endpoint's module there and crashed.
	it('skips non-prerendered routes without importing their components', async () => {
		const { pipeline, manifest, loadedComponents } = createMockPipelineAndManifest({
			'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
			'src/pages/[...slug].astro': () => ({
				getStaticPaths: () => [{ params: { slug: 'blog' } }],
			}),
		});

		const routesList = { routes: [ssrImageEndpoint, prerenderedCatchAll] };
		const result = await matchRoute('/_image', routesList, pipeline, manifest, {
			prerenderOnly: true,
		});

		assert.equal(result, undefined, 'Expected no match so the SSR handler takes over');
		assert.ok(
			!loadedComponents.includes('@astrojs/cloudflare/image-transform-endpoint'),
			'Expected the non-prerendered component to never be imported',
		);
	});

	it('still imports non-prerendered components without prerenderOnly', async () => {
		const { pipeline, manifest } = createMockPipelineAndManifest({
			'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
			'src/pages/[...slug].astro': () => ({
				getStaticPaths: () => [{ params: { slug: 'blog' } }],
			}),
		});

		const routesList = { routes: [ssrImageEndpoint, prerenderedCatchAll] };
		await assert.rejects(
			() => matchRoute('/_image', routesList, pipeline, manifest),
			/cloudflare:workers/,
		);
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

		const { pipeline, manifest, loadedComponents } = createMockPipelineAndManifest({
			'src/pages/foo.ts': runtimeOnlyModule,
			'src/pages/[...slug].astro': () => ({
				getStaticPaths: () => [{ params: { slug: 'bar' } }],
			}),
		});

		// '/foo.html' matches no candidate, so matchRoute retries with '/foo',
		// which must keep skipping the non-prerendered endpoint.
		const routesList = { routes: [ssrEndpoint, prerenderedCatchAll] };
		const result = await matchRoute('/foo.html', routesList, pipeline, manifest, {
			prerenderOnly: true,
		});

		assert.equal(result, undefined, 'Expected no match so the SSR handler takes over');
		assert.ok(
			!loadedComponents.includes('src/pages/foo.ts'),
			'Expected the non-prerendered component to never be imported on the retry',
		);
	});

	it('returns prerendered matches as usual', async () => {
		const { pipeline, manifest } = createMockPipelineAndManifest({
			'@astrojs/cloudflare/image-transform-endpoint': runtimeOnlyModule,
			'src/pages/[...slug].astro': () => ({
				getStaticPaths: () => [{ params: { slug: 'blog' } }],
			}),
		});

		const routesList = { routes: [ssrImageEndpoint, prerenderedCatchAll] };
		const result = await matchRoute('/blog', routesList, pipeline, manifest, {
			prerenderOnly: true,
		});

		assert.ok(result, 'Expected the prerendered catch-all to match');
		assert.equal(result.route.component, 'src/pages/[...slug].astro');
	});
});
