import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { matchAllRoutes } from '../../../dist/core/routing/match.js';
import { createRoutesList } from '../../../dist/core/routing/create-manifest.js';
import { routeComparator } from '../../../dist/core/routing/priority.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import type { RoutesList } from '../../../dist/types/astro.js';
import { createBasicSettings, createFixture, defaultLogger } from '../test-utils.ts';
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
