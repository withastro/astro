import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { describe, it, mock } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';
import { getDataStoreFile } from '../../../dist/content/paths.js';
import {
	astroContentVirtualModPlugin,
	attachDataStoreInvalidation,
} from '../../../dist/content/vite-plugin-content-virtual-mod.js';
import { createMinimalSettings, createTempDir } from './test-helpers.ts';

/**
 * Creates a minimal mock environment module graph.
 */
function createMockModuleGraph() {
	return {
		getModuleById: () => null,
		getModulesByFile: () => null,
		invalidateModule: () => {},
	};
}

/**
 * Creates a minimal mock ViteDevServer with just enough structure for
 * the content virtual mod plugin's buildStart hook.
 */
function createMockViteDevServer() {
	const sentMessages: Array<Record<string, unknown>> = [];
	const watcherListeners = new Map<string, Array<(path: string) => void>>();
	return {
		sentMessages,
		environments: {
			ssr: {
				moduleGraph: createMockModuleGraph(),
				hot: {
					send: (type: unknown, data: unknown) => {
						sentMessages.push({ channel: 'ssr', type, data });
					},
				},
			},
			client: {
				moduleGraph: createMockModuleGraph(),
				hot: {
					send: (payload: Record<string, unknown>) => {
						sentMessages.push({ channel: 'client', ...payload });
					},
				},
			},
		},
		watcher: {
			add: () => {},
			on: (event: string, listener: (path: string) => void) => {
				if (!watcherListeners.has(event)) {
					watcherListeners.set(event, []);
				}
				watcherListeners.get(event)!.push(listener);
			},
			emit: (event: string, path: string) => {
				for (const listener of watcherListeners.get(event) ?? []) {
					listener(path);
				}
			},
		},
	};
}

function countClientReloads(server: ReturnType<typeof createMockViteDevServer>) {
	return server.sentMessages.filter((msg) => msg.channel === 'client' && msg.type === 'full-reload')
		.length;
}

describe('astroContentVirtualModPlugin', () => {
	it('loads chunk files through validated virtual modules', async () => {
		const root = createTempDir('content-virtual-mod-chunks-test-');
		const dataStoreDir = new URL('./.astro/data-store/', root);
		const fileName = '0123456789abcdef.txt';
		const contents = 'serialized data\nwith "quotes"';
		await nodeFs.promises.mkdir(dataStoreDir, { recursive: true });
		await nodeFs.promises.writeFile(new URL(fileName, dataStoreDir), contents);
		await nodeFs.promises.writeFile(
			new URL('manifest.json', dataStoreDir),
			JSON.stringify({ entries: [fileName] }),
		);

		const settings = createMinimalSettings(root, {
			config: {
				experimental: {
					collectionStorage: { type: 'chunked', chunkSize: 1024 },
				},
				legacy: {},
			},
		});
		const plugin = astroContentVirtualModPlugin({ settings, fs: nodeFs });
		// @ts-expect-error - mock args are sufficient for this test
		plugin.config?.({}, { command: 'serve' });
		assert.ok(plugin.resolveId && typeof plugin.resolveId === 'object');
		assert.ok(plugin.load && typeof plugin.load === 'object');

		const context = {
			error(message: string) {
				throw new Error(message);
			},
		};
		const chunkId = `astro:data-layer-content-chunk:${fileName}`;
		// @ts-expect-error - mock context supplies the hook behavior this path uses
		const resolvedChunkId = await plugin.resolveId.handler.call(context, chunkId);
		assert.equal(resolvedChunkId, `\0${chunkId}.mjs`);

		// @ts-expect-error - mock context supplies the hook behavior this path uses
		const chunkModule = await plugin.load.handler.call(context, resolvedChunkId);
		assert.deepEqual(chunkModule, {
			code: `export default ${JSON.stringify(contents)}`,
			map: { mappings: '' },
		});

		// @ts-expect-error - mock context supplies the hook behavior this path uses
		const storeModule = await plugin.load.handler.call(context, '\0astro:data-layer-content');
		assert.ok(storeModule && typeof storeModule === 'object' && 'code' in storeModule);
		assert.match(storeModule.code, /astro:data-layer-content-chunk:0123456789abcdef\.txt/);
		assert.doesNotMatch(storeModule.code, /\?raw/);
	});

	it('rejects invalid chunk virtual module IDs', async () => {
		const root = createTempDir('content-virtual-mod-invalid-chunk-test-');
		const settings = createMinimalSettings(root, {
			config: {
				experimental: {
					collectionStorage: { type: 'chunked', chunkSize: 1024 },
				},
				legacy: {},
			},
		});
		const plugin = astroContentVirtualModPlugin({ settings, fs: nodeFs });
		// @ts-expect-error - mock args are sufficient for this test
		plugin.config?.({}, { command: 'serve' });
		assert.ok(plugin.resolveId && typeof plugin.resolveId === 'object');
		assert.ok(plugin.load && typeof plugin.load === 'object');
		const context = {
			error(message: string) {
				throw new Error(message);
			},
		};

		await assert.rejects(
			// @ts-expect-error - mock context supplies the hook behavior this path uses
			plugin.resolveId.handler.call(context, 'astro:data-layer-content-chunk:../../secret.txt'),
			/Invalid data-store chunk/,
		);
		await assert.rejects(
			// @ts-expect-error - mock context supplies the hook behavior this path uses
			plugin.load.handler.call(context, '\0astro:data-layer-content-chunk:../../secret.txt.mjs'),
			/Invalid data-store chunk/,
		);
	});

	it('does not send full-reload to client during buildStart', () => {
		const root = createTempDir('content-virtual-mod-test-');
		const settings = createMinimalSettings(root, {
			config: {
				legacy: {},
			},
		});
		settings.injectedTypes = [];

		const plugin = astroContentVirtualModPlugin({ settings, fs: nodeFs });

		// Simulate Vite's plugin lifecycle: config → configureServer → buildStart
		// @ts-expect-error - mock args are sufficient for this test
		plugin.config?.({}, { command: 'serve' });

		const mockServer = createMockViteDevServer();
		// @ts-expect-error - mock server has enough structure for this test
		plugin.configureServer?.(mockServer);

		// buildStart is where the bug was: it called invalidateDataStore which sent full-reload
		// @ts-expect-error - calling without full Rollup context
		plugin.buildStart?.();

		// Verify no full-reload was sent to the client
		const clientReloads = mockServer.sentMessages.filter(
			(msg) => msg.channel === 'client' && msg.type === 'full-reload',
		);
		assert.equal(
			clientReloads.length,
			0,
			'buildStart should not send full-reload to client during startup',
		);
	});
});

describe('attachDataStoreInvalidation', () => {
	it('invalidates on store writes without a watcher event, and skips the watcher echo (#17335)', async (t) => {
		const root = createTempDir('content-data-store-invalidation-test-');
		const settings = createMinimalSettings(root, { config: { legacy: {} } });
		const dataStoreFile = getDataStoreFile(settings, true);
		const dataStorePath = fileURLToPath(dataStoreFile);
		await nodeFs.promises.mkdir(settings.dotAstroDir, { recursive: true });

		// Mock only Date so the direct-invalidation echo window can be advanced
		// without waiting; the store's debounce timers stay real.
		t.mock.timers.enable({ apis: ['Date'], now: 10_000 });
		t.after(() => mock.timers.reset());

		const mockServer = createMockViteDevServer();
		const plugin = astroContentVirtualModPlugin({ settings, fs: nodeFs });
		// @ts-expect-error - mock args are sufficient for this test
		plugin.config?.({}, { command: 'serve' });
		// @ts-expect-error - mock server has enough structure for this test
		plugin.configureServer?.(mockServer);

		const store = await MutableDataStore.fromFile(dataStoreFile);
		// @ts-expect-error - mock server has enough structure for this test
		attachDataStoreInvalidation(store, mockServer, settings);

		// A content change is written to the data store. No watcher event is
		// emitted, simulating platforms where the watcher misses the atomic
		// rename (the Windows failure mode in #17335).
		store.set('dogs', 'beagle', { id: 'beagle', data: { breed: 'Beagle' } });
		await store.waitUntilSaveComplete();

		assert.equal(countClientReloads(mockServer), 1, 'the store write should trigger a reload');
		const contentChanged = mockServer.sentMessages.filter(
			(msg) => msg.channel === 'ssr' && msg.type === 'astro:content-changed',
		);
		assert.equal(contentChanged.length, 1, 'the SSR runner should be told content changed');

		// The watcher observes the same write shortly afterwards: that echo must
		// not reload clients a second time.
		mockServer.watcher.emit('change', dataStorePath);
		assert.equal(countClientReloads(mockServer), 1, 'the watcher echo should be skipped');

		// A watcher event well outside the echo window (e.g. another process
		// wrote the store) still invalidates: the fallback path is preserved.
		t.mock.timers.tick(5_000);
		mockServer.watcher.emit('change', dataStorePath);
		assert.equal(countClientReloads(mockServer), 2, 'a later external change should reload');
	});
});
