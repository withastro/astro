import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import configHeadVitePlugin from '../../../dist/vite-plugin-head/index.js';

const METADATA_ID = '\0virtual:astro:component-metadata';
const PAGE_ID = '/src/pages/index.astro';

function createMockModule(id: string) {
	return { id, importers: new Set<any>() };
}

/**
 * Wires the plugin the way a dev server does and records every
 * `invalidateModule` call the plugin makes against the metadata module.
 */
function setupPlugin(moduleIds: string[]) {
	const plugin = configHeadVitePlugin() as any;
	const invalidated: string[] = [];
	const modules = new Map(moduleIds.map((id) => [id, createMockModule(id)]));

	const environment = {
		name: 'ssr',
		moduleGraph: {
			idToModuleMap: modules,
			getModuleById: (id: string) => modules.get(id),
			invalidateModule: (mod: any) => invalidated.push(mod.id),
		},
	};

	plugin.configureServer({
		environments: { ssr: environment },
		watcher: { on() {} },
	});

	return { plugin, invalidated };
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
		const { plugin, invalidated } = setupPlugin([METADATA_ID]);
		const context = { getModuleInfo: () => null };

		plugin.transform.call(context, 'export const componentMetadataEntries = [];', METADATA_ID);

		assert.deepEqual(invalidated, []);
	});

	it('invalidates the metadata module when a component carrying head content is transformed', () => {
		const { plugin, invalidated } = setupPlugin([METADATA_ID, PAGE_ID]);
		const context = {
			getModuleInfo: (id: string) =>
				id === PAGE_ID
					? { id, meta: { astro: { containsHead: true, propagation: 'none' } } }
					: null,
		};

		plugin.transform.call(context, '// compiled page', PAGE_ID);

		assert.ok(
			invalidated.includes(METADATA_ID),
			'a component that carries head content must still invalidate the metadata module',
		);
	});
});
