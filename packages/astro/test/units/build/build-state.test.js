import * as assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
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
	clearIncrementalBuildState,
	createIncrementalBuildState,
	createIncrementalBuildSnapshot,
	getIncrementalBuildStateFile,
	getFullStaticBuildReuseInvalidationReason,
	loadIncrementalBuildState,
	planIncrementalPageGeneration,
	restoreFullStaticBuildOutputs,
	writeIncrementalBuildState,
} from '../../../dist/core/build/build-state.js';
import { createBasicSettings, SpyLogger } from '../test-utils.js';

function createTempRoot() {
	return pathToFileURL(mkdtempSync(join(tmpdir(), 'astro-build-state-')) + '/');
}

async function createSettings(root, inlineConfig = {}) {
	const settings = await createBasicSettings({
		root,
		cacheDir: './node_modules/.astro-build-state/',
		outDir: './dist/build-state/',
		build: {
			client: './dist/build-state/client/',
			server: './dist/build-state/server/',
		},
		...inlineConfig,
	});
	settings.buildOutput = 'static';
	return settings;
}

describe('astro/src/core/build/build-state', () => {
	it('round-trips incremental build state from cacheDir', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
		const logger = new SpyLogger();
		const state = createIncrementalBuildState({
			settings,
			mode: 'production',
			runtimeMode: 'production',
			pageCount: 3,
			buildTimeMs: 42,
		});

		await writeIncrementalBuildState({ settings, logger, state });

		const loaded = await loadIncrementalBuildState({
			settings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.ok(loaded.previousState);
		assert.equal(loaded.invalidationReason, undefined);
		assert.equal(loaded.previousState.summary.pageCount, 3);
		assert.equal(loaded.previousState.artifacts.outDir, settings.config.outDir.toString());
		assert.equal(loaded.previousState.publicDirDigest, null);
	});

	it('invalidates cached state when the Astro config changes', async () => {
		const root = createTempRoot();
		const logger = new SpyLogger();
		const initialSettings = await createSettings(root);

		await writeIncrementalBuildState({
			settings: initialSettings,
			logger,
			state: createIncrementalBuildState({
				settings: initialSettings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 1,
				buildTimeMs: 10,
			}),
		});

		const changedSettings = await createSettings(root, { base: '/docs/' });
		const loaded = await loadIncrementalBuildState({
			settings: changedSettings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.equal(loaded.previousState, undefined);
		assert.equal(loaded.invalidationReason, 'Astro config changed');
	});

	it('invalidates cached state when the Vite config changes', async () => {
		const root = createTempRoot();
		const logger = new SpyLogger();
		const initialSettings = await createSettings(root, {
			vite: {
				define: {
					__FEATURE_FLAG__: JSON.stringify('a'),
				},
			},
		});

		await writeIncrementalBuildState({
			settings: initialSettings,
			logger,
			state: createIncrementalBuildState({
				settings: initialSettings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 1,
				buildTimeMs: 10,
			}),
		});

		const changedSettings = await createSettings(root, {
			vite: {
				define: {
					__FEATURE_FLAG__: JSON.stringify('b'),
				},
			},
		});
		const loaded = await loadIncrementalBuildState({
			settings: changedSettings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.equal(loaded.previousState, undefined);
		assert.equal(loaded.invalidationReason, 'Vite config changed');
	});

	it('invalidates cached state when project metadata changes', async () => {
		const root = createTempRoot();
		const logger = new SpyLogger();
		writeFileSync(
			new URL('./package.json', root),
			JSON.stringify({ name: 'incremental-build-test', version: '1.0.0' }, null, 2),
		);
		const initialSettings = await createSettings(root);

		await writeIncrementalBuildState({
			settings: initialSettings,
			logger,
			state: createIncrementalBuildState({
				settings: initialSettings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 1,
				buildTimeMs: 10,
			}),
		});

		writeFileSync(
			new URL('./package.json', root),
			JSON.stringify({ name: 'incremental-build-test', version: '1.0.1' }, null, 2),
		);

		const loaded = await loadIncrementalBuildState({
			settings: initialSettings,
			logger,
			mode: 'production',
			runtimeMode: 'production',
		});

		assert.equal(loaded.previousState, undefined);
		assert.equal(loaded.invalidationReason, 'project metadata changed');
	});

	it('clears the cached incremental build state', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
		const logger = new SpyLogger();

		await writeIncrementalBuildState({
			settings,
			logger,
			state: createIncrementalBuildState({
				settings,
				mode: 'production',
				runtimeMode: 'production',
				pageCount: 2,
				buildTimeMs: 12,
			}),
		});

		const stateFile = getIncrementalBuildStateFile(settings);
		assert.equal(existsSync(stateFile), true);

		await clearIncrementalBuildState({ settings, logger });

		assert.equal(existsSync(stateFile), false);
	});

	it('captures page dependency and generated path metadata', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
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
		assert.deepEqual(Object.keys(state.inputDigests).sort(), [
			'/src/layouts/Main.astro',
			'/src/lib/shared.ts',
			'/src/pages/blog/[slug].astro',
		]);
		assert.equal(state.dataStoreDigest, null);
		assert.deepEqual(state.pages[0], {
			key: '/blog/[slug]&src/pages/blog/[slug].astro',
			route: '/blog/[slug]',
			component: 'src/pages/blog/[slug].astro',
			moduleSpecifier: '/src/pages/blog/[slug].astro',
			routeType: 'page',
			prerender: true,
			dependencies: {
				modules: ['/src/layouts/Main.astro', '/src/lib/shared.ts', '/src/pages/blog/[slug].astro'],
				hydratedComponents: ['/src/components/Counter.tsx'],
				clientOnlyComponents: ['/src/components/ClientOnly.tsx'],
				scripts: ['/src/pages/blog/[slug].astro'],
				usesDataStore: false,
			},
			assets: {
				styles: [],
				scripts: [],
			},
			generatedPaths: [{ pathname: '/blog/hello', output: 'file:///dist/blog/hello/index.html' }],
		});
	});

	it('plans reuse for unchanged pages and rerenders changed ones', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
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
		mkdirSync(new URL('./dist/build-state/blog/one/', root), { recursive: true });
		mkdirSync(new URL('./dist/build-state/blog/two/', root), { recursive: true });
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
		const settings = await createSettings(root);
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
		const settings = await createSettings(root);
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

	it('fully reuses previous static outputs when tracked inputs and public files are unchanged', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
		const pageData = {
			key: '/&src/pages/index.astro',
			component: 'src/pages/index.astro',
			route: {
				route: '/',
				component: 'src/pages/index.astro',
				type: 'page',
				prerender: true,
				distURL: [],
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
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html></html>');
		mkdirSync(new URL('./dist/build-state/_astro/', root), { recursive: true });
		writeFileSync(new URL('./dist/build-state/_astro/index.css', root), 'body{}');

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
		previousState.pages[0].assets.styles = ['external:/_astro/index.css'];

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			undefined,
		);

		const pageNames = [];
		restoreFullStaticBuildOutputs({
			settings,
			allPages,
			previousState,
			pageNames,
		});

		assert.deepEqual(pageNames, ['']);
		assert.deepEqual(
			pageData.route.distURL.map((entry) => entry.toString()),
			[new URL('./dist/build-state/index.html', root).toString()],
		);
	});

	it('disables full static reuse when the public directory changes', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
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
		mkdirSync(new URL('./public/', root), { recursive: true });
		writeFileSync(new URL('./public/logo.txt', root), 'old');
		mkdirSync(new URL('./dist/build-state/', root), { recursive: true });
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html></html>');

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

		writeFileSync(new URL('./public/logo.txt', root), 'new');

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'public directory changed',
		);
	});

	it('disables full static reuse when a persisted output is missing', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
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

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'persisted outputs missing',
		);
	});

	it('disables full static reuse when a persisted asset is missing', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
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
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html></html>');

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
		previousState.pages[0].assets.styles = ['external:/_astro/index.css'];

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'persisted assets missing',
		);
	});

	it('disables full static reuse when dynamic routes are present', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root);
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
		mkdirSync(new URL('./src/pages/blog/', root), { recursive: true });
		writeFileSync(new URL('./src/pages/blog/[slug].astro', root), '<h1>Hello</h1>');
		mkdirSync(new URL('./dist/build-state/blog/example/', root), { recursive: true });
		writeFileSync(new URL('./dist/build-state/blog/example/index.html', root), '<html></html>');

		const previousInternals = createBuildInternals();
		trackPageData(
			previousInternals,
			pageData.component,
			pageData,
			'/src/pages/blog/[slug].astro',
			new URL('./src/pages/blog/[slug].astro', root),
		);
		recordGeneratedPagePath(
			previousInternals,
			pageData.key,
			'/blog/example',
			new URL('./dist/build-state/blog/example/index.html', root).toString(),
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

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'dynamic routes require fresh path generation',
		);
	});

	it('disables full static reuse when an integration needs build:setup', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root, {
			integrations: [
				{
					name: 'hooked',
					hooks: {
						'astro:build:setup': () => {},
					},
				},
			],
		});
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
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html></html>');

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

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'astro:build:setup hook requires fresh generation',
		);
	});

	it('disables full static reuse when an integration needs build:ssr', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root, {
			integrations: [
				{
					name: 'hooked',
					hooks: {
						'astro:build:ssr': () => {},
					},
				},
			],
		});
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
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html></html>');

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

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'astro:build:ssr hook requires fresh generation',
		);
	});

	it('disables full static reuse when an integration needs build:generated', async () => {
		const root = createTempRoot();
		const settings = await createSettings(root, {
			integrations: [
				{
					name: 'hooked',
					hooks: {
						'astro:build:generated': () => {},
					},
				},
			],
		});
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
		writeFileSync(new URL('./dist/build-state/index.html', root), '<html></html>');

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

		assert.equal(
			getFullStaticBuildReuseInvalidationReason({
				settings,
				allPages,
				previousState,
			}),
			'astro:build:generated hook requires fresh generation',
		);
	});
});
