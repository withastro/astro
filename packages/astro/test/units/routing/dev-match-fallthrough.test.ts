import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { matchRoute } from '../../../dist/core/routing/dev.js';
import { makeRoute, dynamicPart } from './test-helpers.ts';
import { defaultLogger } from '../test-utils.ts';
import { RouteCache } from '../../../dist/core/render/route-cache.js';

import type { RunnablePipeline } from '../../../dist/vite-plugin-app/pipeline.js';
import type { RouteData } from '../../../dist/types/public/index.js';
import type { SSRManifest } from '../../../dist/core/app/types.js';

/**
 * Creates a minimal mock pipeline and manifest for testing matchRoute.
 * `componentModules` maps route component paths to their module exports.
 */
function createMockPipelineAndManifest(componentModules: Record<string, any>) {
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
			return componentModules[route.component];
		},
	} as unknown as RunnablePipeline;
	return { pipeline, manifest };
}

describe('matchRoute in dev', () => {
	it('continues to next route when getStaticPaths throws a user error', async () => {
		const trailingSlash = 'ignore';

		// Route A: [c]/[b]/[a] — getStaticPaths throws
		const routeA = makeRoute({
			segments: [[dynamicPart('c')], [dynamicPart('b')], [dynamicPart('a')]],
			trailingSlash,
			route: '/[c]/[b]/[a]',
			pathname: undefined,
			component: 'src/pages/[c]/[b]/[a].astro',
			prerender: true,
		});

		// Route B: [c]/[d]/[b] (index) — getStaticPaths returns valid params
		const routeB = makeRoute({
			segments: [[dynamicPart('c')], [dynamicPart('d')], [dynamicPart('b')]],
			trailingSlash,
			route: '/[c]/[d]/[b]',
			pathname: undefined,
			component: 'src/pages/[c]/[d]/[b]/index.astro',
			prerender: true,
			isIndex: true,
		});

		const componentModules = {
			'src/pages/[c]/[b]/[a].astro': {
				getStaticPaths() {
					throw new Error('static paths error');
				},
			},
			'src/pages/[c]/[d]/[b]/index.astro': {
				getStaticPaths() {
					return [{ params: { c: '1', d: '2', b: '4' } }];
				},
			},
		};

		const { pipeline, manifest } = createMockPipelineAndManifest(componentModules);

		const routesList = { routes: [routeA, routeB] };
		const result = await matchRoute('/1/2/4', routesList, pipeline, manifest);

		assert.ok(result, 'Expected a matched route');
		assert.equal(result.route.component, 'src/pages/[c]/[d]/[b]/index.astro');
	});

	it('throws error when no other route matches after getStaticPaths error', async () => {
		const trailingSlash = 'ignore';

		const routeA = makeRoute({
			segments: [[dynamicPart('c')], [dynamicPart('b')], [dynamicPart('a')]],
			trailingSlash,
			route: '/[c]/[b]/[a]',
			pathname: undefined,
			component: 'src/pages/[c]/[b]/[a].astro',
			prerender: true,
		});

		const componentModules = {
			'src/pages/[c]/[b]/[a].astro': {
				getStaticPaths() {
					throw new Error('static paths error');
				},
			},
		};

		const { pipeline, manifest } = createMockPipelineAndManifest(componentModules);

		const routesList = { routes: [routeA] };
		await assert.rejects(
			() => matchRoute('/1/2/3', routesList, pipeline, manifest),
			(err) => {
				assert.ok(err instanceof Error);
				assert.equal(err.message, 'static paths error');
				return true;
			},
		);
	});
});
