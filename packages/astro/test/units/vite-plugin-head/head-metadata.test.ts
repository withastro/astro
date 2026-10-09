import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import configHeadVitePlugin from '../../../dist/vite-plugin-head/index.js';

const METADATA_ID = '\0virtual:astro:component-metadata';
const PAGE_ID = '/src/pages/index.astro';

function createMockModule(id: string, hasTransformResult = false) {
	return {
		id,
		importers: new Set<any>(),
		transformResult: hasTransformResult ? { etag: `etag-${id}` } : null,
	};
}

/**
 * Wires the plugin the way a dev server does and records every
 * `invalidateModule` call the plugin makes against the metadata module.
 */
function setupPlugin(moduleIds: string[], { withTransformResults = false } = {}) {
	const plugin = configHeadVitePlugin() as any;
	const invalidated: string[] = [];
	const modules = new Map(moduleIds.map((id) => [id, createMockModule(id, withTransformResults)]));
	const deletedEtags: string[] = [];

	const environment = {
		name: 'ssr',
		moduleGraph: {
			idToModuleMap: modules,
			getModuleById: (id: string) => modules.get(id),
			invalidateModule: (mod: any) => invalidated.push(mod.id),
			etagToModuleMap: {
				delete: (etag: string) => deletedEtags.push(etag),
			},
		},
	};

	plugin.configureServer({
		environments: { ssr: environment },
		watcher: { on() {} },
	});

	return { plugin, invalidated, modules, deletedEtags };
}

describe('astro:head-metadata', () => {
	// Regression test for https://github.com/withastro/astro/issues/17995
	//
	// The metadata virtual module is imported by the dev app entrypoint, so
	// invalidating it invalidates that whole import chain. When the plugin
	// invalidated it from its own `transform` hook, every evaluation of the
	// module scheduled the next one and the module runner re-evaluated the
	// server graph on every request for the rest of the session.
	it('does not invalidate the metadata module when transforming it', () => {
		const { plugin, modules } = setupPlugin([METADATA_ID], { withTransformResults: true });
		const context = { getModuleInfo: () => null };
		const metadataMod = modules.get(METADATA_ID)!;

		plugin.transform.call(context, 'export const componentMetadataEntries = [];', METADATA_ID);

		// The virtual module's transform result should NOT be cleared when
		// transforming itself (the #17995 guard).
		assert.notEqual(metadataMod.transformResult, null);
	});

	it('clears the metadata module transform result when a component is transformed', () => {
		const { plugin, modules, deletedEtags } = setupPlugin([METADATA_ID, PAGE_ID], {
			withTransformResults: true,
		});
		const context = {
			getModuleInfo: (id: string) =>
				id === PAGE_ID
					? { id, meta: { astro: { containsHead: true, propagation: 'none' } } }
					: null,
		};
		const metadataMod = modules.get(METADATA_ID)!;

		plugin.transform.call(context, '// compiled page', PAGE_ID);

		assert.equal(
			metadataMod.transformResult,
			null,
			'transform result should be cleared so the next import gets fresh metadata',
		);
		assert.ok(deletedEtags.includes(`etag-${METADATA_ID}`), 'etag should be cleaned up');
	});

	// Regression test for https://github.com/withastro/astro/issues/18132
	//
	// invalidateModule() cascades to all importers, which in pre-bundled
	// environments (Cloudflare) means the entire SSR module graph gets
	// re-evaluated. The plugin should clear only the virtual module's
	// transformResult without calling invalidateModule.
	it('does not call invalidateModule (avoids cascade to importers)', () => {
		const { plugin, invalidated } = setupPlugin([METADATA_ID, PAGE_ID], {
			withTransformResults: true,
		});
		const context = {
			getModuleInfo: (id: string) =>
				id === PAGE_ID
					? { id, meta: { astro: { containsHead: true, propagation: 'none' } } }
					: null,
		};

		plugin.transform.call(context, '// compiled page', PAGE_ID);

		assert.deepEqual(
			invalidated,
			[],
			'invalidateModule must not be called — it cascades to importers',
		);
	});
});
