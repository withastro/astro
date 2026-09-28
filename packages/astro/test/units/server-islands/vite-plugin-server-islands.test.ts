import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { vitePluginServerIslands } from '../../../dist/core/server-islands/vite-plugin-server-islands.js';
import { ServerIslandsState } from '../../../dist/core/server-islands/shared-state.js';

const RESOLVED_MANIFEST_ID = '\0virtual:astro:server-island-manifest';
const ASTRO_FILE_ID = '/src/pages/index.astro';

describe('astro:server-islands invalidation', () => {
	// Regression test for https://github.com/withastro/astro/issues/18132
	//
	// invalidateModule() cascades to all importers. In pre-bundled environments
	// (Cloudflare adapter), the cascade reaches the entire SSR module graph,
	// causing concurrent requests to observe partially-initialized modules
	// (e.g. astro:actions returning undefined). The plugin should clear only
	// the virtual module's transformResult.
	it('clears transform result without calling invalidateModule', () => {
		const serverIslandsState = new ServerIslandsState();
		serverIslandsState.discover({
			resolvedPath: '/src/components/Island.astro',
			localName: 'Island',
			specifier: '/src/components/Island.astro',
			importer: ASTRO_FILE_ID,
		});

		const plugin = vitePluginServerIslands({
			settings: { adapter: { name: 'test' } } as any,
			serverIslandsState,
		} as any) as any;

		plugin.config({}, { command: 'serve' });

		const invalidated: string[] = [];
		const deletedEtags: string[] = [];
		const manifestMod = {
			id: RESOLVED_MANIFEST_ID,
			transformResult: { etag: 'manifest-etag' },
		};

		const environment = {
			name: 'ssr',
			moduleGraph: {
				getModuleById: (id: string) => (id === RESOLVED_MANIFEST_ID ? manifestMod : null),
				invalidateModule: (mod: any) => invalidated.push(mod.id),
				etagToModuleMap: {
					delete: (etag: string) => deletedEtags.push(etag),
				},
			},
		};

		plugin.configureServer({
			environments: { ssr: environment, prerender: undefined, astro: undefined },
		});

		const context = {
			getModuleInfo: () => ({
				meta: { astro: { serverComponents: [] } },
			}),
			environment: { name: 'ssr' },
		};

		plugin.transform.handler.call(context, '// page code', ASTRO_FILE_ID);

		assert.equal(
			manifestMod.transformResult,
			null,
			'transform result should be cleared so the next import gets fresh content',
		);
		assert.ok(deletedEtags.includes('manifest-etag'), 'etag should be cleaned up');
		assert.deepEqual(
			invalidated,
			[],
			'invalidateModule must not be called — it cascades to importers',
		);
	});
});
