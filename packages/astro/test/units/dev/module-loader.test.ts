import * as assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import { createViteLoader } from '../../../dist/core/module-loader/vite.js';

/**
 * Creates a minimal mock ViteDevServer with stub watcher and client hot.
 */
function createMockViteServer(environments: Record<string, unknown>) {
	return /** @type {any} */ ({
		watcher: new EventEmitter(),
		environments: {
			client: { hot: { send: () => {} } },
			...environments,
		},
		ssrFixStacktrace() {},
		config: { root: '/tmp' },
	}) as any;
}

/**
 * Creates a minimal mock RunnableDevEnvironment.
 */
function createMockEnvironment(name: string) {
	return /** @type {any} */ ({
		name,
		runner: { import: async () => ({}) },
		pluginContainer: {
			resolveId: async () => null,
			getModuleInfo: () => null,
		},
		moduleGraph: {
			getModuleById: () => undefined,
			getModulesByFile: () => undefined,
			idToModuleMap: new Map(),
			invalidateModule: () => {},
		},
		config: { server: { https: false } },
	}) as any;
}

describe('createViteLoader', () => {
	it('getSSREnvironment returns the passed ssrEnvironment, not always the ssr env', () => {
		const ssrEnv = createMockEnvironment('ssr');
		const prerenderEnv = createMockEnvironment('prerender');

		const viteServer = createMockViteServer({
			ssr: ssrEnv,
			prerender: prerenderEnv,
		});

		// Create a loader with the prerender environment (as Cloudflare adapter does
		// when prerenderEnvironment: 'node' is set)
		const loader = createViteLoader(viteServer, prerenderEnv);

		// getSSREnvironment() should return the passed environment (prerender),
		// not the hardcoded viteServer.environments['ssr']
		assert.equal(loader.getSSREnvironment(), prerenderEnv);
		assert.notEqual(loader.getSSREnvironment(), ssrEnv);
	});

	it('getSSREnvironment returns ssr env when ssr env is passed', () => {
		const ssrEnv = createMockEnvironment('ssr');

		const viteServer = createMockViteServer({
			ssr: ssrEnv,
		});

		const loader = createViteLoader(viteServer, ssrEnv);

		// When the ssr env is passed directly, getSSREnvironment returns it
		assert.equal(loader.getSSREnvironment(), ssrEnv);
	});
});
