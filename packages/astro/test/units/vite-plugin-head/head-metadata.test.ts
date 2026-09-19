import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import configHeadVitePlugin from '../../../dist/vite-plugin-head/index.js';

const METADATA_ID = '\0virtual:astro:component-metadata';
const PAGE_ID = '/src/pages/index.astro';

function createMockModule(id: string) {
	return { id, importers: new Set<unknown>() };
}

type WatcherListener = (file: string) => void;

/**
 * Wires the plugin the way a dev server does and records every
 * `invalidateModule` call the plugin makes against the metadata module.
 * `watchedFiles` maps file paths to the ids of the modules each file backs, so
 * tests can drive the plugin's watcher listeners.
 */
function setupPlugin(moduleIds: string[], watchedFiles: Record<string, string[]> = {}) {
	const plugin = configHeadVitePlugin() as any;
	const invalidated: string[] = [];
	const modules = new Map(moduleIds.map((id) => [id, createMockModule(id)]));
	const watcherListeners = new Map<string, WatcherListener[]>();

	const environment = {
		name: 'ssr',
		moduleGraph: {
			idToModuleMap: modules,
			getModuleById: (id: string) => modules.get(id),
			getModulesByFile: (file: string) => {
				const ids = watchedFiles[file];
				return ids ? new Set(ids) : undefined;
			},
			invalidateModule: (mod: { id: string }) => invalidated.push(mod.id),
		},
	};

	plugin.configureServer({
		environments: { ssr: environment },
		watcher: {
			on(event: string, listener: WatcherListener) {
				watcherListeners.set(event, [...(watcherListeners.get(event) ?? []), listener]);
			},
		},
	});

	const fireWatcher = (event: string, file: string) => {
		for (const listener of watcherListeners.get(event) ?? []) listener(file);
	};

	return { plugin, invalidated, fireWatcher };
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

	// Regression test for https://github.com/withastro/astro/issues/18065
	//
	// The Cloudflare dev runtime rewrites files under `.wrangler/state` while a
	// request is served. Those files belong to no module graph, so they cannot
	// have changed the metadata this module reports; invalidating it for them
	// invalidated the dev app entrypoint that imports it, which made the runner
	// re-evaluate the server graph on the next request.
	it('does not invalidate the metadata module for files outside the module graph', () => {
		const { invalidated, fireWatcher } = setupPlugin([METADATA_ID, PAGE_ID], {
			[PAGE_ID]: [PAGE_ID],
		});
		const unrelated = '/project/.wrangler/state/v3/observability/trace-store.sqlite-wal';

		fireWatcher('add', unrelated);
		fireWatcher('change', unrelated);
		fireWatcher('unlink', unrelated);

		assert.deepEqual(invalidated, []);
	});

	it('invalidates the metadata module when a watched module file changes', () => {
		const { invalidated, fireWatcher } = setupPlugin([METADATA_ID, PAGE_ID], {
			[PAGE_ID]: [PAGE_ID],
		});

		fireWatcher('change', PAGE_ID);
		fireWatcher('unlink', PAGE_ID);

		assert.deepEqual(invalidated, [METADATA_ID, METADATA_ID]);
	});
});
