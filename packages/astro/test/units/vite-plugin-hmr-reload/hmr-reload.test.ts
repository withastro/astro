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
			url: id,
			lastInvalidationTimestamp: 0,
			lastHMRTimestamp: 0,
			lastHMRInvalidationReceived: false,
			ssrModule: null,
			ssrError: null,
			transformResult: null,
			invalidationState: undefined,
			staticImportedUrls: undefined,
			ssrTransformResult: null,
		};
	}

	function createMockContext(options: {
		environmentName: string;
		modules: ReturnType<typeof createMockModule>[];
		clientModuleIds?: string[];
	}) {
		const wsSent: any[] = [];
		const invalidated: any[] = [];

		const environment = {
			name: options.environmentName,
			moduleGraph: {
				invalidateModule(mod: any, seen?: Set<any>, _ts?: number, _hmr?: boolean) {
					invalidated.push(mod);
					if (seen) seen.add(mod);
				},
				getModuleById(id: string) {
					return null;
				},
			},
		};

		const clientModuleIds = new Set(options.clientModuleIds ?? []);

		const server = {
			ws: {
				send(payload: any) {
					wsSent.push(payload);
				},
			},
			environments: {
				client: {
					moduleGraph: {
						getModuleById(id: string) {
							return clientModuleIds.has(id) ? { id } : null;
						},
					},
				},
			},
		};

		const handler = getHotUpdateHandler();

		return {
			environment,
			server,
			wsSent,
			invalidated,
			call() {
				return handler.call(
					{ environment } as any,
					{
						modules: options.modules,
						server,
						timestamp: Date.now(),
						read: async () => '',
						type: 'update' as const,
						file: options.modules[0]?.file ?? '',
					} as any,
				);
			},
		};
	}

	function getHotUpdateHandler() {
		const plugin = hmrReload();
		// The hotUpdate hook is an object with order and handler
		const hotUpdate = (plugin as any).hotUpdate;
		return hotUpdate.handler;
	}

	it('returns SSR-only modules instead of empty array so Vite can propagate to module runner', () => {
		const mod = createMockModule('/src/components/Blog.astro');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			clientModuleIds: [], // Not in client → SSR-only
		});

		const result = ctx.call();

		// The fix: should return the SSR-only modules, NOT an empty array
		assert.ok(Array.isArray(result), 'should return an array');
		assert.equal(result.length, 1, 'should return the SSR-only module');
		assert.equal(result[0], mod, 'should return the same module object');

		// Should still send full-reload to browser
		assert.equal(ctx.wsSent.length, 1);
		assert.deepEqual(ctx.wsSent[0], { type: 'full-reload' });
	});

	it('returns undefined for non-server environments', () => {
		const mod = createMockModule('/src/components/Blog.astro');
		const ctx = createMockContext({
			environmentName: 'client',
			modules: [mod],
		});

		const result = ctx.call();
		assert.equal(result, undefined);
	});

	it('returns empty array for style-only modules to prevent unnecessary reloads', () => {
		const mod = createMockModule('/src/styles/main.css', '/src/styles/main.css');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
		});

		const result = ctx.call();
		assert.ok(Array.isArray(result), 'should return an array');
		assert.equal(result.length, 0, 'should return empty array for styles');
	});

	it('does not include client-side modules in SSR-only list', () => {
		const ssrMod = createMockModule('/src/components/ServerOnly.astro');
		const clientMod = createMockModule('/src/components/ClientComponent.tsx');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [ssrMod, clientMod],
			clientModuleIds: ['/src/components/ClientComponent.tsx'],
		});

		const result = ctx.call();

		assert.ok(Array.isArray(result), 'should return an array');
		assert.equal(result.length, 1, 'should only include SSR-only module');
		assert.equal(result[0], ssrMod);
	});
});
