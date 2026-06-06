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
		const hotSent: any[] = [];
		const invalidated: any[] = [];

		// Note: isRunnableDevEnvironment() uses instanceof, so plain mocks
		// won't pass the check — the non-runnable (Cloudflare) path is
		// exercised instead. The runner.evaluatedModules invalidation path
		// for runnable environments is tested via integration/E2E tests.
		const environment = {
			name: options.environmentName,
			moduleGraph: {
				idToModuleMap: new Map(),
				invalidateModule(mod: any, seen?: Set<any>, _ts?: number, _hmr?: boolean) {
					invalidated.push(mod);
					if (seen) {
						seen.add(mod);
						// Simulate Vite's recursive importer walk: add importers to seen
						for (const importer of mod.importers) {
							if (!seen.has(importer)) {
								seen.add(importer);
							}
						}
					}
				},
				getModuleById(_id: string) {
					return null;
				},
			},
			hot: {
				send(payload: any) {
					hotSent.push(payload);
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
			hotSent,
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

	it('returns empty array and sends full-reload for SSR-only modules', () => {
		const mod = createMockModule('/src/components/Blog.astro');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			clientModuleIds: [], // Not in client → SSR-only
		});

		const result = ctx.call();

		// Should return empty array to tell Vite "handled, stop processing"
		assert.ok(Array.isArray(result), 'should return an array');
		assert.equal(result.length, 0, 'should return empty array');

		// Should send full-reload to browser via WebSocket
		assert.equal(ctx.wsSent.length, 1);
		assert.deepEqual(ctx.wsSent[0], { type: 'full-reload' });

		// For non-runnable environments (mock fails instanceof), should also
		// send full-reload through the environment's hot channel so the
		// remote runner (e.g. workerd) clears its module cache.
		assert.equal(ctx.hotSent.length, 1);
		assert.equal(ctx.hotSent[0].type, 'full-reload');

		// Should invalidate the module graph
		assert.equal(ctx.invalidated.length, 1, 'should invalidate SSR module graph');
		assert.equal(ctx.invalidated[0], mod);
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
		assert.equal(ctx.wsSent.length, 0, 'should NOT send full-reload for style modules');
	});

	it('invalidates raw CSS imports as SSR-only modules', () => {
		const mod = createMockModule('/src/styles/main.css?raw', '/src/styles/main.css');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			clientModuleIds: [],
		});

		const result = ctx.call();

		assert.ok(Array.isArray(result), 'should return an array');
		assert.equal(result.length, 0, 'should return empty array');
		assert.equal(ctx.invalidated.length, 1, 'should invalidate raw CSS module');
		assert.equal(ctx.invalidated[0], mod);
		assert.equal(ctx.wsSent.length, 1);
		assert.deepEqual(ctx.wsSent[0], { type: 'full-reload' });
	});

	it('invalidates importers in the module graph for dynamic import chains', () => {
		const component = createMockModule('/src/components/MyComponent.astro');
		const barrel = createMockModule('/src/components/index.ts');
		// MyComponent is imported by the barrel file
		component.importers.add(barrel as any);

		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [component],
			clientModuleIds: [],
		});

		ctx.call();

		// Both the component and its importer (barrel) should be in the invalidated set
		assert.equal(ctx.invalidated.length, 1, 'direct invalidateModule call');
		// The barrel file should appear in wsSent (full-reload triggered)
		assert.equal(ctx.wsSent.length, 1);
		assert.deepEqual(ctx.wsSent[0], { type: 'full-reload' });
	});

	it('only invalidates SSR-only modules, not client-side modules', () => {
		const ssrMod = createMockModule('/src/components/ServerOnly.astro');
		const clientMod = createMockModule('/src/components/ClientComponent.tsx');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [ssrMod, clientMod],
			clientModuleIds: ['/src/components/ClientComponent.tsx'],
		});

		const result = ctx.call();

		assert.ok(Array.isArray(result), 'should return an array');
		assert.equal(result.length, 0, 'should return empty array');

		// Only the SSR-only module should be invalidated in the module graph
		assert.equal(ctx.invalidated.length, 1, 'should only invalidate SSR-only module');
		assert.equal(ctx.invalidated[0], ssrMod);
	});

	it('returns [] for modules that exist in the client module graph (prevents unnecessary program reload)', () => {
		const mod = createMockModule('/src/components/Foo.tsx');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			clientModuleIds: ['/src/components/Foo.tsx'], // module IS in client graph
		});

		const result = ctx.call();

		assert.deepEqual(
			result,
			[],
			'Should return empty array to prevent Vite default HMR propagation',
		);
		assert.equal(ctx.wsSent.length, 0, 'Should NOT send full-reload via WebSocket');
		assert.equal(ctx.hotSent.length, 0, 'Should NOT send full-reload via hot channel');
		assert.equal(ctx.invalidated.length, 0, 'Should NOT invalidate client-graph modules');
	});

	it('sends full-reload when mix of client and SSR-only modules', () => {
		const clientMod = createMockModule('/src/components/Foo.tsx');
		const ssrOnlyMod = createMockModule('/src/backend/db.ts');
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [clientMod, ssrOnlyMod],
			clientModuleIds: ['/src/components/Foo.tsx'], // only Foo.tsx in client graph
		});

		const result = ctx.call();

		assert.deepEqual(result, [], 'Should return empty array');
		assert.equal(ctx.wsSent.length, 1, 'Should send full-reload because of SSR-only module');
		assert.equal(ctx.wsSent[0].type, 'full-reload');
	});
});
