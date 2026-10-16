import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBuildInternals } from '../../../dist/core/build/internal.js';
import { pluginCSS } from '../../../dist/core/build/plugins/plugin-css.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../../dist/core/constants.js';

describe('plugin-css generateBundle', () => {
	it('preserves conditionally-rendered island CSS without assigning to bundle object (Rolldown compatibility)', async () => {
		const internals = createBuildInternals();

		// Configure SSR: css module was bundled, but the component export was NOT rendered in SSR
		const svelteModuleId = '/src/components/Panel.svelte';
		const svelteCssModuleId = '/src/components/Panel.svelte?astro&type=style&index=0&lang.css';
		internals.cssModuleToChunkIdMap.set(svelteCssModuleId, 'ssr-chunk.js');

		// In SSR, Panel export was not rendered (ssrRenderedExports has no entry or doesn't have default)
		internals.ssrRenderedExports = new Map([[svelteModuleId, new Set<string>()]]);

		// Track Panel as a hydrated component belonging to a page
		internals.discoveredHydratedComponents.set(svelteModuleId, {} as any);
		internals.discoveredHydratedComponents.set('/src/components/Redundant.astro', {} as any);
		internals.ssrRenderedExports.set('/src/components/Redundant.astro', new Set(['default']));
		internals.pagesByHydratedComponent.set(
			svelteModuleId,
			new Set([
				{
					component: '/src/pages/index.astro',
					route: { pattern: '/' },
					styles: [],
				} as any,
			]),
		);

		const plugins = pluginCSS({} as any, internals);
		const buildCssPlugin = plugins.find((p) => p.name === 'astro:rollup-plugin-build-css')!;

		const panelCssAsset = {
			type: 'asset' as const,
			fileName: '_astro/Panel.hash.css',
			source: '.box { color: red; }',
		};

		const redundantCssAsset = {
			type: 'asset' as const,
			fileName: '_astro/Redundant.hash.css',
			source: '.redundant { color: blue; }',
		};

		const redundantCssModuleId = '/src/components/Redundant.astro?astro&type=style&index=0&lang.css';
		internals.cssModuleToChunkIdMap.set(redundantCssModuleId, 'ssr-chunk.js');

		const clientChunk = {
			type: 'chunk' as const,
			fileName: '_astro/client.js',
			facadeModuleId: svelteModuleId,
			modules: {
				[svelteModuleId]: {
					renderedExports: ['default'],
				},
				[svelteCssModuleId]: {
					renderedExports: [],
				},
			},
			viteMetadata: {
				importedCss: new Set([panelCssAsset.fileName]),
			},
		};

		const redundantChunk = {
			type: 'chunk' as const,
			fileName: '_astro/redundant.js',
			facadeModuleId: '/src/components/Redundant.astro',
			modules: {
				['/src/components/Redundant.astro']: {
					renderedExports: ['default'],
				},
				[redundantCssModuleId]: {
					renderedExports: [],
				},
			},
			viteMetadata: {
				importedCss: new Set([redundantCssAsset.fileName]),
			},
		};

		const rawBundle: Record<string, any> = {
			[panelCssAsset.fileName]: panelCssAsset,
			[redundantCssAsset.fileName]: redundantCssAsset,
			[clientChunk.fileName]: clientChunk,
			[redundantChunk.fileName]: redundantChunk,
		};

		// Rolldown proxy: disallows reassigning to bundle object (reproducing Issue #18337)
		let assignAttempted = false;
		const rolldownBundle = new Proxy(rawBundle, {
			set(_target, _prop, _value) {
				assignAttempted = true;
				// In Rolldown, assigning to bundle variable is ignored
				return true;
			},
			deleteProperty(target, prop) {
				delete target[prop as string];
				return true;
			},
		});

		// Mock PluginContext with client environment and module graph traversal
		const mockContext = {
			environment: { name: ASTRO_VITE_ENVIRONMENT_NAMES.client },
			getModuleInfo(id: string) {
				if (id === svelteCssModuleId) {
					return {
						id,
						importers: [svelteModuleId],
						dynamicImporters: [],
						importedIds: [],
						dynamicallyImportedIds: [],
						meta: {
							vite: {
								cssScopeTo: [svelteModuleId, 'default'],
							},
						},
					};
				}
				if (id === svelteModuleId) {
					return {
						id,
						importers: [],
						dynamicImporters: [],
						importedIds: [svelteCssModuleId],
						dynamicallyImportedIds: [],
					};
				}
				return {
					id,
					importers: [],
					dynamicImporters: [],
					importedIds: [],
					dynamicallyImportedIds: [],
				};
			},
		};

		await (buildCssPlugin as any).generateBundle.call(mockContext, {}, rolldownBundle);

		// Assertions:
		// 1. Rolldown warning must NOT occur (no assignment to bundle variable)
		assert.equal(assignAttempted, false, 'Should not attempt to reassign to bundle variable in Rolldown');
		// 2. Conditionally rendered island CSS must survive in bundle
		assert.ok(rolldownBundle[panelCssAsset.fileName], 'Conditionally-rendered island CSS should not be dropped');
		// 3. Redundant CSS should be deleted
		assert.equal(rolldownBundle[redundantCssAsset.fileName], undefined, 'Redundant CSS should be deleted');
	});
});
