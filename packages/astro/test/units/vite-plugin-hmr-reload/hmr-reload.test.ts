import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import hmrReload from '../../../dist/vite-plugin-hmr-reload/index.js';

describe('astro:hmr-reload', () => {
	/**
	 * Creates a mock EnvironmentModuleNode.
	 */
	function createMockModule(id: string, file?: string) {
		return {
			id,
			file: file ?? id,
			type: 'js' as const,
			importers: new Set(),
			importedModules: new Set(),
			acceptedHmrDeps: new Set(),
			acceptedHmrExports: null,
			isSelfAccepting: false,
			transformResult: null,
			ssrTransformResult: null,
			ssrModule: null,
			ssrError: null,
			lastHMRTimestamp: 0,
			url: id,
		};
	}

	/**
	 * Creates a mock environment (server-side) with a name and moduleGraph.
	 */
	function createMockEnvironment(name: string, moduleIds: string[] = []) {
		const idToModuleMap = new Map<string, any>();
		for (const id of moduleIds) {
			idToModuleMap.set(id, createMockModule(id));
		}
		return {
			name,
			moduleGraph: {
				getModuleById(id: string) {
					return idToModuleMap.get(id) ?? null;
				},
				invalidateModule(_mod: any) {},
			},
		};
	}

	/**
	 * Creates a mock server with client and ssr environments.
	 */
	function createMockServer(clientModuleIds: string[] = []) {
		const wsSent: any[] = [];
		return {
			environments: {
				client: createMockEnvironment('client', clientModuleIds),
			},
			ws: {
				send(payload: any) {
					wsSent.push(payload);
				},
			},
			_wsSent: wsSent,
		};
	}

	function getHotUpdateHandler() {
		const plugin = hmrReload();
		const hotUpdate = plugin.hotUpdate as any;
		return hotUpdate.handler;
	}

	it('returns [] for modules that exist in the client module graph (prevents unnecessary program reload)', () => {
		const handler = getHotUpdateHandler();
		const moduleId = '/src/components/Foo.tsx';
		const modules = [createMockModule(moduleId)];
		const server = createMockServer([moduleId]); // module IS in client graph
		const env = createMockEnvironment('ssr');

		const result = handler.call(
			{ environment: env },
			{ modules, server, timestamp: Date.now() },
		);

		assert.deepEqual(result, [], 'Should return empty array to prevent Vite default HMR propagation');
		assert.equal(server._wsSent.length, 0, 'Should NOT send full-reload via WebSocket');
	});

	it('sends full-reload for SSR-only modules not in client graph', () => {
		const handler = getHotUpdateHandler();
		const moduleId = '/src/backend/db.ts';
		const modules = [createMockModule(moduleId)];
		const server = createMockServer([]); // module is NOT in client graph
		const env = createMockEnvironment('ssr');

		const result = handler.call(
			{ environment: env },
			{ modules, server, timestamp: Date.now() },
		);

		assert.deepEqual(result, [], 'Should return empty array');
		assert.equal(server._wsSent.length, 1, 'Should send full-reload');
		assert.equal(server._wsSent[0].type, 'full-reload');
	});

	it('returns undefined for non-server environments', () => {
		const handler = getHotUpdateHandler();
		const modules = [createMockModule('/src/components/Foo.tsx')];
		const server = createMockServer();
		const env = createMockEnvironment('client');

		const result = handler.call(
			{ environment: env },
			{ modules, server, timestamp: Date.now() },
		);

		assert.equal(result, undefined, 'Should return undefined for client environment');
	});

	it('returns [] for style-only modules', () => {
		const handler = getHotUpdateHandler();
		const modules = [createMockModule('/src/styles/main.css', '/src/styles/main.css')];
		const server = createMockServer();
		const env = createMockEnvironment('ssr');

		const result = handler.call(
			{ environment: env },
			{ modules, server, timestamp: Date.now() },
		);

		assert.deepEqual(result, [], 'Should return empty array for style modules');
		assert.equal(server._wsSent.length, 0, 'Should NOT send full-reload for style modules');
	});

	it('sends full-reload when mix of client and SSR-only modules', () => {
		const handler = getHotUpdateHandler();
		const clientModuleId = '/src/components/Foo.tsx';
		const ssrOnlyModuleId = '/src/backend/db.ts';
		const modules = [
			createMockModule(clientModuleId),
			createMockModule(ssrOnlyModuleId),
		];
		const server = createMockServer([clientModuleId]); // only Foo.tsx in client graph
		const env = createMockEnvironment('ssr');

		const result = handler.call(
			{ environment: env },
			{ modules, server, timestamp: Date.now() },
		);

		assert.deepEqual(result, [], 'Should return empty array');
		assert.equal(server._wsSent.length, 1, 'Should send full-reload because of SSR-only module');
		assert.equal(server._wsSent[0].type, 'full-reload');
	});
});
