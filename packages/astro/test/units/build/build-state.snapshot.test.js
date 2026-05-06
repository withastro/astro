import * as assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
	createBuildInternals,
	recordGeneratedPagePath,
	trackClientOnlyPageDatas,
	trackHydratedComponentPageDatas,
	trackModulePageDatas,
	trackPageData,
	trackScriptPageDatas,
} from '../../../dist/core/build/internal.js';
import {
	createIncrementalBuildState,
	createIncrementalBuildSnapshot,
} from '../../../dist/core/build/build-state.js';
import { createIncrementalBuildSettings, createTempRoot } from './test-helpers.ts';

describe('astro/src/core/build/build-state snapshot', () => {
	it('captures page dependency and generated path metadata', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const pageData = {
			key: '/blog/[slug]&src/pages/blog/[slug].astro',
			component: 'src/pages/blog/[slug].astro',
			route: {
				route: '/blog/[slug]',
				component: 'src/pages/blog/[slug].astro',
				type: 'page',
				prerender: true,
			},
			moduleSpecifier: '',
			styles: [],
		};
		const allPages = {
			[pageData.key]: pageData,
		};
		const internals = createBuildInternals();
		mkdirSync(new URL('./src/pages/blog/', root), { recursive: true });
		mkdirSync(new URL('./src/layouts/', root), { recursive: true });
		mkdirSync(new URL('./src/lib/', root), { recursive: true });
		mkdirSync(new URL('./src/components/', root), { recursive: true });
		writeFileSync(new URL('./src/pages/blog/[slug].astro', root), '---\n---\n');
		writeFileSync(new URL('./src/layouts/Main.astro', root), '---\n---\n');
		writeFileSync(new URL('./src/lib/shared.ts', root), 'export const shared = true;\n');
		writeFileSync(
			new URL('./src/components/Counter.tsx', root),
			'export default function Counter() {}',
		);
		writeFileSync(
			new URL('./src/components/ClientOnly.tsx', root),
			'export default function ClientOnly() {}',
		);

		trackPageData(
			internals,
			pageData.component,
			pageData,
			'/src/pages/blog/[slug].astro',
			new URL('./src/pages/blog/[slug].astro', root),
		);
		trackModulePageDatas(internals, pageData, [
			'/src/layouts/Main.astro',
			'/src/lib/shared.ts?astro&lang.ts',
		]);
		trackHydratedComponentPageDatas(internals, pageData, ['/src/components/Counter.tsx']);
		trackClientOnlyPageDatas(internals, pageData, ['/src/components/ClientOnly.tsx']);
		trackScriptPageDatas(internals, pageData, [
			'/src/pages/blog/[slug].astro?astro&type=script&index=0&lang.ts',
		]);
		recordGeneratedPagePath(
			internals,
			pageData.key,
			'/blog/hello',
			'file:///dist/blog/hello/index.html',
		);

		const state = createIncrementalBuildState({
			settings,
			mode: 'production',
			runtimeMode: 'production',
			pageCount: 1,
			buildTimeMs: 21,
			allPages,
			internals,
		});

		assert.ok(state.pages);
		assert.equal(state.pages.length, 1);
		assert.deepEqual(Object.keys(state.dependencyDigests).sort(), [
			'file:/src/components/ClientOnly.tsx',
			'file:/src/components/Counter.tsx',
			'file:/src/layouts/Main.astro',
			'file:/src/lib/shared.ts',
			'file:/src/pages/blog/[slug].astro',
		]);
		assert.deepEqual(state.dataDigests, {});
		assert.deepEqual(state.pages[0], {
			key: '/blog/[slug]&src/pages/blog/[slug].astro',
			route: '/blog/[slug]',
			component: 'src/pages/blog/[slug].astro',
			moduleSpecifier: '/src/pages/blog/[slug].astro',
			routeType: 'page',
			prerender: true,
			dependencies: {
				modules: [
					'file:/src/layouts/Main.astro',
					'file:/src/lib/shared.ts',
					'file:/src/pages/blog/[slug].astro',
				],
				hydratedComponents: ['file:/src/components/Counter.tsx'],
				clientOnlyComponents: ['file:/src/components/ClientOnly.tsx'],
				scripts: ['file:/src/pages/blog/[slug].astro'],
				data: [],
			},
			assets: {
				styles: [],
				scripts: [],
			},
			generatedPaths: [{ pathname: '/blog/hello', output: 'file:///dist/blog/hello/index.html' }],
		});
	});

	it('does not persist synthetic route-like identifiers as file-backed dependency keys', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const pageData = {
			key: '/docs-start&/docs-start/',
			component: 'src/pages/docs-start.astro',
			route: {
				route: '/docs-start',
				component: 'src/pages/docs-start.astro',
				type: 'redirect',
				prerender: true,
			},
			moduleSpecifier: '/docs-start/',
			styles: [],
		};
		const allPages = {
			[pageData.key]: pageData,
		};
		const internals = createBuildInternals();

		const snapshot = createIncrementalBuildSnapshot({
			settings,
			allPages,
			internals,
		});

		assert.deepEqual(snapshot.dependencyDigests, {});
		assert.deepEqual(snapshot.pages[0].dependencies, {
			modules: [],
			hydratedComponents: [],
			clientOnlyComponents: [],
			scripts: [],
			data: [],
		});
		assert.equal(snapshot.pages[0].moduleSpecifier, '/docs-start/');
	});
});
