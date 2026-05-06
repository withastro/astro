import * as assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
	createBuildInternals,
	recordGeneratedPagePath,
	trackModulePageDatas,
	trackPageData,
} from '../../../dist/core/build/internal.js';
import {
	createIncrementalBuildState,
	createIncrementalBuildSnapshot,
	planIncrementalPageGeneration,
} from '../../../dist/core/build/build-state.js';
import { createIncrementalBuildSettings, createTempRoot } from './test-helpers.ts';

describe('astro/src/core/build/build-state planner', () => {
	it('plans reuse for unchanged pages and rerenders changed ones', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const unchangedOutput = new URL('./dist/build-state/index.html', root).toString();
		const changedOutputOne = new URL('./dist/build-state/blog/one/index.html', root).toString();
		const changedOutputTwo = new URL('./dist/build-state/blog/two/index.html', root).toString();
		const changedOutputThree = new URL('./dist/build-state/blog/three/index.html', root).toString();
		const unchangedPage = {
			key: '/&src/pages/index.astro',
			component: 'src/pages/index.astro',
			route: {
				route: '/',
				component: 'src/pages/index.astro',
				type: 'page',
				prerender: true,
			},
			moduleSpecifier: '',
			styles: [],
		};
		const changedPage = {
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
			[unchangedPage.key]: unchangedPage,
			[changedPage.key]: changedPage,
		};
		mkdirSync(new URL('./src/pages/blog/', root), { recursive: true });
		mkdirSync(new URL('./src/layouts/', root), { recursive: true });
		mkdirSync(new URL('./src/lib/', root), { recursive: true });
		mkdirSync(new URL('./dist/build-state/blog/one/', root), { recursive: true });
		mkdirSync(new URL('./dist/build-state/blog/two/', root), { recursive: true });
		writeFileSync(new URL('./src/pages/index.astro', root), '---\n---\n');
		writeFileSync(new URL('./src/pages/blog/[slug].astro', root), '---\n---\n');
		writeFileSync(new URL('./src/layouts/Main.astro', root), '---\n---\n');
		writeFileSync(new URL('./src/lib/blog.ts', root), 'export const posts = [];\n');
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html>index</html>');
		writeFileSync(new URL('./dist/build-state/blog/one/index.html', root), '<html>one</html>');
		writeFileSync(new URL('./dist/build-state/blog/two/index.html', root), '<html>two</html>');
		const previousInternals = createBuildInternals();

		trackPageData(
			previousInternals,
			unchangedPage.component,
			unchangedPage,
			'/src/pages/index.astro',
			new URL('./src/pages/index.astro', root),
		);
		trackModulePageDatas(previousInternals, unchangedPage, ['/src/layouts/Main.astro']);
		recordGeneratedPagePath(previousInternals, unchangedPage.key, '/', unchangedOutput);

		trackPageData(
			previousInternals,
			changedPage.component,
			changedPage,
			'/src/pages/blog/[slug].astro',
			new URL('./src/pages/blog/[slug].astro', root),
		);
		trackModulePageDatas(previousInternals, changedPage, ['/src/lib/blog.ts']);
		recordGeneratedPagePath(previousInternals, changedPage.key, '/blog/one', changedOutputOne);
		recordGeneratedPagePath(previousInternals, changedPage.key, '/blog/two', changedOutputTwo);

		const previousState = createIncrementalBuildState({
			settings,
			mode: 'production',
			runtimeMode: 'production',
			pageCount: 3,
			buildTimeMs: 12,
			allPages,
			internals: previousInternals,
		});
		writeFileSync(new URL('./src/lib/extra.ts', root), 'export const extra = true;\n');

		const currentInternals = createBuildInternals();
		trackPageData(
			currentInternals,
			unchangedPage.component,
			unchangedPage,
			'/src/pages/index.astro',
			new URL('./src/pages/index.astro', root),
		);
		trackModulePageDatas(currentInternals, unchangedPage, ['/src/layouts/Main.astro']);

		trackPageData(
			currentInternals,
			changedPage.component,
			changedPage,
			'/src/pages/blog/[slug].astro',
			new URL('./src/pages/blog/[slug].astro', root),
		);
		trackModulePageDatas(currentInternals, changedPage, ['/src/lib/blog.ts', '/src/lib/extra.ts']);

		const currentSnapshot = createIncrementalBuildSnapshot({
			settings,
			allPages,
			internals: currentInternals,
			generatedPathsByPage: new Map([
				[unchangedPage.key, [{ pathname: '/', output: unchangedOutput }]],
				[
					changedPage.key,
					[
						{ pathname: '/blog/one', output: changedOutputOne },
						{ pathname: '/blog/two', output: changedOutputTwo },
						{ pathname: '/blog/three', output: changedOutputThree },
					],
				],
			]),
		});

		const plan = planIncrementalPageGeneration({
			previousState,
			currentSnapshot,
		});

		assert.deepEqual(plan.pagePlans.get(unchangedPage.key), {
			pageKey: unchangedPage.key,
			renderPathnames: [],
			reusedPathnames: ['/'],
			outputsToDelete: [],
		});
		assert.deepEqual(plan.pagePlans.get(changedPage.key), {
			pageKey: changedPage.key,
			renderPathnames: ['/blog/one', '/blog/two', '/blog/three'],
			reusedPathnames: [],
			outputsToDelete: [changedOutputOne, changedOutputTwo],
			reason: 'page dependencies changed',
		});
		assert.equal(plan.renderedPathCount, 3);
		assert.equal(plan.reusedPathCount, 1);
	});

	it('rerenders a page when its emitted asset set changes', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const pageData = {
			key: '/&src/pages/index.astro',
			component: 'src/pages/index.astro',
			route: {
				route: '/',
				component: 'src/pages/index.astro',
				type: 'page',
				prerender: true,
			},
			moduleSpecifier: '',
			styles: [],
		};
		const allPages = {
			[pageData.key]: pageData,
		};
		const previousInternals = createBuildInternals();
		trackPageData(
			previousInternals,
			pageData.component,
			pageData,
			'/src/pages/index.astro',
			new URL('./src/pages/index.astro', root),
		);
		recordGeneratedPagePath(previousInternals, pageData.key, '/', 'file:///dist/index.html');
		const previousState = createIncrementalBuildState({
			settings,
			mode: 'production',
			runtimeMode: 'production',
			pageCount: 1,
			buildTimeMs: 10,
			allPages,
			internals: previousInternals,
		});
		previousState.pages[0].assets.styles = ['external:_astro/index.old.css'];

		const currentInternals = createBuildInternals();
		trackPageData(
			currentInternals,
			pageData.component,
			pageData,
			'/src/pages/index.astro',
			new URL('./src/pages/index.astro', root),
		);
		recordGeneratedPagePath(currentInternals, pageData.key, '/', 'file:///dist/index.html');
		const currentSnapshot = createIncrementalBuildSnapshot({
			settings,
			allPages,
			internals: currentInternals,
		});

		const plan = planIncrementalPageGeneration({
			previousState,
			currentSnapshot,
		});

		assert.deepEqual(plan.pagePlans.get(pageData.key), {
			pageKey: pageData.key,
			renderPathnames: ['/'],
			reusedPathnames: [],
			outputsToDelete: ['file:///dist/index.html'],
			reason: 'page styles changed',
		});
	});

	it('rerenders a path when its previous output file is missing', async () => {
		const root = createTempRoot();
		const settings = await createIncrementalBuildSettings(root);
		const pageData = {
			key: '/&src/pages/index.astro',
			component: 'src/pages/index.astro',
			route: {
				route: '/',
				component: 'src/pages/index.astro',
				type: 'page',
				prerender: true,
			},
			moduleSpecifier: '',
			styles: [],
		};
		const allPages = {
			[pageData.key]: pageData,
		};
		mkdirSync(new URL('./src/pages/', root), { recursive: true });
		writeFileSync(new URL('./src/pages/index.astro', root), '<h1>Hello</h1>');
		mkdirSync(new URL('./dist/build-state/', root), { recursive: true });

		const previousInternals = createBuildInternals();
		trackPageData(
			previousInternals,
			pageData.component,
			pageData,
			'/src/pages/index.astro',
			new URL('./src/pages/index.astro', root),
		);
		recordGeneratedPagePath(
			previousInternals,
			pageData.key,
			'/',
			new URL('./dist/build-state/index.html', root).toString(),
		);

		const previousState = createIncrementalBuildState({
			settings,
			mode: 'production',
			runtimeMode: 'production',
			pageCount: 1,
			buildTimeMs: 10,
			allPages,
			internals: previousInternals,
		});

		const currentInternals = createBuildInternals();
		trackPageData(
			currentInternals,
			pageData.component,
			pageData,
			'/src/pages/index.astro',
			new URL('./src/pages/index.astro', root),
		);
		recordGeneratedPagePath(
			currentInternals,
			pageData.key,
			'/',
			new URL('./dist/build-state/index.html', root).toString(),
		);

		const plan = planIncrementalPageGeneration({
			previousState,
			currentSnapshot: createIncrementalBuildSnapshot({
				settings,
				allPages,
				internals: currentInternals,
			}),
		});

		assert.deepEqual(plan.pagePlans.get(pageData.key), {
			pageKey: pageData.key,
			renderPathnames: ['/'],
			reusedPathnames: [],
			outputsToDelete: [],
		});
		assert.equal(plan.renderedPathCount, 1);
		assert.equal(plan.reusedPathCount, 0);
	});
});
