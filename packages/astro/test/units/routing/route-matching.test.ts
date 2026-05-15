import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { matchAllRoutes, matchRoute } from '../../../dist/core/routing/match.js';
import { createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import { routeComparator } from '../../../dist/core/routing/priority.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import type { RoutesList } from '../../../dist/types/astro.js';
import { createBasicSettings, createFixture, defaultLogger } from '../test-utils.ts';
import { dynamicPart, makeRoute, spreadPart, staticPart } from './test-helpers.ts';
import type { FsFixture } from 'fs-fixture';

const fileSystem: Record<string, string> = {
	'/src/pages/[serverDynamic].astro': `
		---
		export const prerender = false;
		---
		<p>Server dynamic route! slug:{Astro.params.serverDynamic}</p>
		`,

	'/src/pages/[xStaticDynamic].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						xStaticDynamic: "static-dynamic-route-here",
					},
				},
			];
		}
		---
		<p>Prerendered dynamic route!</p>
		`,
	'/src/pages/[aStaticDynamic].astro': `
			---
			export function getStaticPaths() {
				return [
					{
						params: {
							aStaticDynamic: "another-static-dynamic-route-here",
						},
					},
				];
			}
			---
			<p>Another prerendered dynamic route!</p>
	`,
	'/src/pages/[...serverRest].astro': `
	---
	export const prerender = false;
	---
	<p>Server rest route! slug:{Astro.params.serverRest}</p>
	`,
	'/src/pages/[...xStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						xStaticRest: undefined,
					},
				},
			];
		}
		---
		<p>Prerendered rest route!</p>
`,
	'/src/pages/[...aStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						aStaticRest: "another/static-rest-route-here",
					},
				},
			];
		}
		---
		<p>Another prerendered rest route!</p>
`,

	'/src/pages/nested/[...serverRest].astro': `
	---
	export const prerender = false;
	---
	<p>Nested server rest route! slug: {Astro.params.serverRest}</p>
	`,
	'/src/pages/nested/[...xStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						xStaticRest: undefined,
					},
				},
			];
		}
		---
		<p>Nested prerendered rest route!</p>
`,
	'/src/pages/nested/[...aStaticRest].astro': `
		---
		export function getStaticPaths() {
			return [
				{
					params: {
						aStaticRest: "another-nested-static-dynamic-rest-route-here",
					},
				},
			];
		}
		---
		<p>Another nested prerendered rest route!</p>
`,
};

/**
 * Sorts matched routes following the same logic as getSortedPreloadedMatches,
 * but without requiring a full pipeline/container.
 */
function sortMatches(matches: RouteData[]): RouteData[] {
	return matches
		.slice()
		.sort((a, b) => routeComparator(a, b))
		.sort((a, b) => {
			// Prioritize prerendered routes over server routes when patterns are equal
			if (a.pattern.source === b.pattern.source) {
				if (a.prerender !== b.prerender) {
					return a.prerender ? -1 : 1;
				}
				return a.component < b.component ? -1 : 1;
			}
			return 0;
		});
}

describe('Route matching', () => {
	let fixture: FsFixture;
	let manifestData: RoutesList;

	before(async () => {
		fixture = await createFixture(fileSystem);
		const settings = await createBasicSettings({
			root: fixture.path,
			trailingSlash: 'never',
			output: 'static',
		});
		manifestData = await createRoutesList(
			{
				cwd: fixture.path,
				settings,
			},
			defaultLogger,
		);
	});

	after(async () => {
		await fixture.rm();
	});

	describe('Matched routes', () => {
		it('should be sorted correctly', async () => {
			const matches = matchAllRoutes('/try-matching-a-route', manifestData);
			const sortedMatches = sortMatches(matches);
			const sortedRouteNames = sortedMatches.map((match) => match.route);

			assert.deepEqual(sortedRouteNames, [
				'/[astaticdynamic]',
				'/[xstaticdynamic]',
				'/[serverdynamic]',
				'/[...astaticrest]',
				'/[...xstaticrest]',
				'/[...serverrest]',
			]);
		});
	});
});

describe('matchRoute prefers specific SSR routes over prerendered catch-all', () => {
	// Regression test for #16746: when a prerendered catch-all route like [...page]
	// exists, the dev prerender middleware should not intercept requests that have a
	// more specific SSR route (e.g. /_actions/[...path]).
	const trailingSlash = 'never' as const;

	function createTestRoutesList(): RoutesList {
		// Routes are ordered by priority as Astro's route manifest would sort them:
		// static/specific routes first, then dynamic, then spread/catch-all last.
		const routes = [
			makeRoute({
				segments: [[staticPart('_server-islands')], [dynamicPart('name')]],
				trailingSlash,
				route: '/_server-islands/[name]',
				pathname: undefined,
				type: 'endpoint',
				prerender: false,
			}),
			makeRoute({
				segments: [[staticPart('_actions')], [spreadPart('path')]],
				trailingSlash,
				route: '/_actions/[...path]',
				pathname: undefined,
				type: 'endpoint',
				prerender: false,
			}),
			makeRoute({
				segments: [],
				trailingSlash,
				route: '/',
				pathname: '/',
				isIndex: true,
				prerender: true,
			}),
			makeRoute({
				segments: [[spreadPart('page')]],
				trailingSlash,
				route: '/[...page]',
				pathname: undefined,
				prerender: true,
			}),
		];

		// Sort using the same comparator as the real manifest
		routes.sort((a, b) => routeComparator(a, b));

		return { routes };
	}

	it('returns SSR action route for /_actions/hello, not prerendered catch-all', () => {
		const routesList = createTestRoutesList();
		const match = matchRoute('/_actions/hello', routesList);
		assert.ok(match, 'Expected a match for /_actions/hello');
		assert.equal(match.route, '/_actions/[...path]');
		assert.equal(match.prerender, false);
	});

	it('returns SSR server-islands route, not prerendered catch-all', () => {
		const routesList = createTestRoutesList();
		const match = matchRoute('/_server-islands/MyComponent', routesList);
		assert.ok(match, 'Expected a match for /_server-islands/MyComponent');
		assert.equal(match.route, '/_server-islands/[name]');
		assert.equal(match.prerender, false);
	});

	it('returns prerendered index for /', () => {
		const routesList = createTestRoutesList();
		const match = matchRoute('/', routesList);
		assert.ok(match, 'Expected a match for /');
		assert.equal(match.route, '/');
		assert.equal(match.prerender, true);
	});

	it('returns prerendered catch-all for /some-page', () => {
		const routesList = createTestRoutesList();
		const match = matchRoute('/some-page', routesList);
		assert.ok(match, 'Expected a match for /some-page');
		assert.equal(match.route, '/[...page]');
		assert.equal(match.prerender, true);
	});

	it('matchAllRoutes returns both SSR and prerendered routes for /_actions/hello', () => {
		// This verifies that matchAllRoutes DOES match the prerendered catch-all,
		// confirming why the old code was broken (it used .some(r => r.prerender)
		// which would be true even though the best match is SSR).
		const routesList = createTestRoutesList();
		const matches = matchAllRoutes('/_actions/hello', routesList);
		assert.equal(matches.length, 2);
		const routeNames = matches.map((m) => m.route);
		assert.ok(routeNames.includes('/_actions/[...path]'));
		assert.ok(routeNames.includes('/[...page]'));
	});
});
