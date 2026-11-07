import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import hmrReload from '../../../dist/vite-plugin-hmr-reload/index.js';
import type { DevEnvironment } from 'vite';

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
		fetchModule?: DevEnvironment['fetchModule'];
	}) {
		const wsSent: any[] = [];
		const hotSent: any[] = [];
		const invalidated: any[] = [];
		const modules = new Map<string, ReturnType<typeof createMockModule>>();
		function collect(mod: ReturnType<typeof createMockModule>) {
			if (modules.has(mod.id)) return;
			modules.set(mod.id, mod);
			for (const importer of mod.importers)
				collect(importer as ReturnType<typeof createMockModule>);
		}
		for (const mod of options.modules) collect(mod);

		// Note: isRunnableDevEnvironment() uses instanceof, so plain mocks
		// won't pass the check — the non-runnable (Cloudflare) path is
		// exercised instead. The runner.evaluatedModules invalidation path
		// for runnable environments is tested via integration/E2E tests.
		const environment = {
			name: options.environmentName,
			fetchModule:
				options.fetchModule ??
				(async (url, _importer, options) =>
					options?.cached
						? { cache: true as const }
						: { code: '', file: url, id: url, url, invalidate: false }),
			moduleGraph: {
				idToModuleMap: new Map(),
				invalidateModule(mod: any, seen?: Set<any>, _ts?: number, _hmr?: boolean) {
					invalidated.push(mod);
					function visit(node: any) {
						if (!seen || seen.has(node)) return;
						seen.add(node);
						for (const importer of node.importers) visit(importer);
					}
					visit(mod);
				},
				getModuleById(id: string) {
					return modules.get(id);
				},
				async getModuleByUrl(url: string) {
					return modules.get(url);
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

		// Preserve unrelated remote-runner dependencies. The module graph is
		// invalidated below and changed modules are refreshed by fetchModule;
		// no whole-cache reset should be sent to the remote runner.
		assert.equal(ctx.hotSent.length, 0);

		// Should invalidate the module graph
		assert.equal(ctx.invalidated.length, 1, 'should invalidate SSR module graph');
		assert.equal(ctx.invalidated[0], mod);
	});

	it('refreshes evaluated exports even if the transform cache was already warmed', async () => {
		const mod = createMockModule('/src/value.js');
		const calls: Array<boolean | undefined> = [];
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			async fetchModule(url, _importer, options) {
				calls.push(options?.cached);
				return options?.cached
					? { cache: true }
					: { code: 'export const value = 1', id: url, file: url, url, invalidate: false };
			},
		});
		ctx.call();
		const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		assert.ok('invalidate' in result && result.invalidate);
		assert.deepEqual(await ctx.environment.fetchModule(mod.id, undefined, { cached: true }), {
			cache: true,
		});
		assert.deepEqual(
			calls,
			[true, false, true],
			'only the first affected runner fetch must be invalidated',
		);
	});

	it('does not invalidate an unrelated remote dependency', async () => {
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [createMockModule('/src/value.js')],
		});
		ctx.call();
		assert.deepEqual(
			await ctx.environment.fetchModule('/node_modules/react.js', undefined, { cached: true }),
			{ cache: true },
		);
	});

	it('does not let analysis fetches consume a pending remote invalidation', async () => {
		const mod = createMockModule('/src/lazy.js');
		const ctx = createMockContext({ environmentName: 'ssr', modules: [mod] });
		ctx.call();
		const analysis = await ctx.environment.fetchModule(mod.id);
		assert.ok('invalidate' in analysis && !analysis.invalidate);
		const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		assert.ok('invalidate' in result && result.invalidate);
	});

	it('consumes invalidation when a remote runner first loads an uncached module', async () => {
		const mod = createMockModule('/src/value.js');
		const ctx = createMockContext({ environmentName: 'ssr', modules: [mod] });
		ctx.call();
		const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: false });
		assert.ok('invalidate' in result && result.invalidate);
		assert.deepEqual(await ctx.environment.fetchModule(mod.id, undefined, { cached: true }), {
			cache: true,
		});
	});

	it('refreshes every transitively invalidated remote importer', async () => {
		const leaf = createMockModule('/src/value.js');
		const barrel = createMockModule('/src/index.js');
		const page = createMockModule('/src/page.astro');
		leaf.importers.add(barrel as any);
		barrel.importers.add(page as any);
		const ctx = createMockContext({ environmentName: 'ssr', modules: [leaf] });
		ctx.call();
		for (const mod of [leaf, barrel, page]) {
			const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: true });
			assert.ok('invalidate' in result && result.invalidate, mod.id);
		}
	});

	it('retains invalidation after a failed module refetch', async () => {
		const mod = createMockModule('/src/value.js');
		let fail = true;
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			async fetchModule(url, _importer, options) {
				if (options?.cached) return { cache: true };
				if (fail) {
					fail = false;
					throw new Error('transform failed');
				}
				return { code: '', id: url, file: url, url, invalidate: false };
			},
		});
		ctx.call();
		await assert.rejects(
			() => ctx.environment.fetchModule(mod.id, undefined, { cached: true }),
			/transform failed/,
		);
		const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		assert.ok('invalidate' in result && result.invalidate);
	});

	it('does not lose a newer edit arriving during a cache check', async () => {
		const mod = createMockModule('/src/value.js');
		const check = Promise.withResolvers<void>();
		let first = true;
		let refetches = 0;
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			async fetchModule(url, _importer, options) {
				if (options?.cached) {
					if (first) {
						first = false;
						await check.promise;
					}
					return { cache: true };
				}
				refetches++;
				return { code: '', id: url, file: url, url, invalidate: false };
			},
		});
		ctx.call();
		const pending = ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		ctx.call();
		check.resolve();
		await pending;
		const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		assert.ok('invalidate' in result && result.invalidate);
		assert.equal(refetches, 2);
	});

	it('does not lose a newer edit arriving during a refetch', async () => {
		const mod = createMockModule('/src/value.js');
		const entered = Promise.withResolvers<void>();
		const release = Promise.withResolvers<void>();
		let refetches = 0;
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [mod],
			async fetchModule(url, _importer, options) {
				if (options?.cached) return { cache: true };
				if (++refetches === 1) {
					entered.resolve();
					await release.promise;
				}
				return { code: '', id: url, file: url, url, invalidate: false };
			},
		});
		ctx.call();
		const pending = ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		await entered.promise;
		ctx.call();
		release.resolve();
		await pending;
		const result = await ctx.environment.fetchModule(mod.id, undefined, { cached: true });
		assert.ok('invalidate' in result && result.invalidate);
		assert.equal(refetches, 2);
	});

	it('preserves externalized module responses', async () => {
		const external = { externalize: 'node:fs', type: 'builtin' as const };
		const ctx = createMockContext({
			environmentName: 'ssr',
			modules: [createMockModule('/src/value.js')],
			async fetchModule() {
				return external;
			},
		});
		ctx.call();
		assert.equal(
			await ctx.environment.fetchModule('node:fs', undefined, { cached: true }),
			external,
		);
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
			clientModuleIds: ['/src/styles/main.css'],
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
