import * as assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
	createBuildInternals,
	recordGeneratedPagePath,
	trackPageData,
} from '../../../dist/core/build/internal.js';
import {
	createIncrementalBuildState,
	getFullStaticBuildReuseInvalidationReason,
	restoreFullStaticBuildOutputs,
} from '../../../dist/core/build/build-state.js';
import { createIncrementalBuildSettings, createTempRoot } from './test-helpers.ts';

describe('astro/src/core/build/build-state reuse', () => {
	it('fully reuses previous static outputs when tracked inputs and public files are unchanged', async () => {
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
		const settings = await createIncrementalBuildSettings(root, {
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
		const settings = await createIncrementalBuildSettings(root, {
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
		const settings = await createIncrementalBuildSettings(root, {
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
