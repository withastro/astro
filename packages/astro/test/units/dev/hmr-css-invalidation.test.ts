import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import hmrReload from '../../../dist/vite-plugin-hmr-reload/index.js';

/**
 * Tests for CSS HMR invalidation of SSR dev-css virtual modules.
 *
 * When a CSS file changes during dev, the astro:hmr-reload plugin must
 * invalidate the per-route virtual:astro:dev-css:* modules in the SSR
 * environment so the next SSR render picks up fresh CSS content.
 * Without this, the server-rendered inline <style> tags serve stale CSS.
 *
 * Note: Runner evaluation cache invalidation (via isRunnableDevEnvironment)
 * requires a real Vite RunnableDevEnvironment instance and cannot be unit
 * tested with mocks. That path is verified through manual integration testing.
 */
describe('astro:hmr-reload CSS invalidation', () => {
	type HotUpdateHandler = (
		this: { environment: unknown },
		context: {
			modules: Array<{ id: string | null; file?: string }>;
			server: unknown;
			timestamp: number;
			file: string;
		},
	) => unknown;

	function getHotUpdateHandler(): HotUpdateHandler {
		const plugin = hmrReload();
		const hotUpdate = plugin.hotUpdate;

		assert.ok(hotUpdate && typeof hotUpdate === 'object' && 'handler' in hotUpdate);

		return hotUpdate.handler as unknown as HotUpdateHandler;
	}

	/**
	 * Creates a mock environment and context for testing the hotUpdate handler.
	 * The environment mock is not a real RunnableDevEnvironment, so
	 * isRunnableDevEnvironment() will return false. This means runner cache
	 * invalidation won't be tested here, but module graph invalidation will.
	 */
	function createMockContext(options: {
		modules: Array<{ id: string | null; file?: string }>;
		moduleGraphEntries?: Array<[string, { id: string }]>;
	}) {
		const invalidatedModuleGraphIds: string[] = [];

		const moduleGraphEntries = new Map<string, { id: string }>(options.moduleGraphEntries ?? []);

		const environment = {
			name: 'ssr',
			moduleGraph: {
				idToModuleMap: moduleGraphEntries,
				getModuleById: (id: string) => moduleGraphEntries.get(id) ?? null,
				invalidateModule: (
					mod: { id: string },
					_seen?: Set<unknown>,
					_ts?: number,
					_isHmr?: boolean,
				) => {
					invalidatedModuleGraphIds.push(mod.id);
				},
			},
			hot: { send: () => {} },
		};

		const server = {
			environments: {
				client: {
					moduleGraph: {
						getModuleById: (_id: string) => null as object | null,
					},
				},
			},
			ws: { send: () => {} },
		};

		return {
			environment,
			server,
			invalidatedModuleGraphIds,
		};
	}

	it('invalidates dev-css virtual modules in module graph when a CSS file changes', () => {
		const devCssId1 = '\0virtual:astro:dev-css:src/pages/index@_@astro';
		const devCssId2 = '\0virtual:astro:dev-css:src/pages/posts/[id]@_@astro';

		const { environment, server, invalidatedModuleGraphIds } = createMockContext({
			modules: [{ id: '/path/to/global.css', file: '/path/to/global.css' }],
			moduleGraphEntries: [
				[devCssId1, { id: devCssId1 }],
				[devCssId2, { id: devCssId2 }],
				['some-other-module', { id: 'some-other-module' }],
			],
		});

		const hotUpdate = getHotUpdateHandler();

		const result = hotUpdate.call(
			{ environment },
			{
				modules: [{ id: '/path/to/global.css', file: '/path/to/global.css' }],
				server,
				timestamp: Date.now(),
				file: '/path/to/global.css',
			},
		);

		// Should return empty array (handled, no full reload)
		assert.deepEqual(result, []);

		// Both dev-css virtual modules should be invalidated in the module graph
		assert.ok(
			invalidatedModuleGraphIds.includes(devCssId1),
			'dev-css module for index should be invalidated in module graph',
		);
		assert.ok(
			invalidatedModuleGraphIds.includes(devCssId2),
			'dev-css module for dynamic route should be invalidated in module graph',
		);

		// Non-dev-css modules should NOT be invalidated
		assert.ok(
			!invalidatedModuleGraphIds.includes('some-other-module'),
			'non-dev-css modules should not be invalidated',
		);
	});

	it('invalidates dev-css modules for SCSS file changes', () => {
		const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';

		const { environment, server, invalidatedModuleGraphIds } = createMockContext({
			modules: [{ id: '/path/to/styles.scss', file: '/path/to/styles.scss' }],
			moduleGraphEntries: [[devCssId, { id: devCssId }]],
		});

		const hotUpdate = getHotUpdateHandler();

		const result = hotUpdate.call(
			{ environment },
			{
				modules: [{ id: '/path/to/styles.scss', file: '/path/to/styles.scss' }],
				server,
				timestamp: Date.now(),
				file: '/path/to/styles.scss',
			},
		);

		assert.deepEqual(result, []);
		assert.ok(
			invalidatedModuleGraphIds.includes(devCssId),
			'dev-css module should be invalidated for SCSS changes',
		);
	});

	it('invalidates dev-css modules for Astro style virtual modules regardless of query order', () => {
		const astroStyleIds = [
			'/src/Component.astro?astro&type=style&index=0&lang.css',
			'/src/Component.astro?type=style&astro&index=0&lang.scss',
			'/src/Component.astro?index=1&lang.less&type=style&astro',
		];

		for (const id of astroStyleIds) {
			const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
			const { environment, server, invalidatedModuleGraphIds } = createMockContext({
				modules: [{ id, file: '/src/Component.astro' }],
				moduleGraphEntries: [[devCssId, { id: devCssId }]],
			});

			const hotUpdate = getHotUpdateHandler();

			const result = hotUpdate.call(
				{ environment },
				{
					modules: [{ id, file: '/src/Component.astro' }],
					server,
					timestamp: Date.now(),
					file: '/src/Component.astro',
				},
			);

			assert.deepEqual(result, []);
			assert.ok(
				invalidatedModuleGraphIds.includes(devCssId),
				`dev-css module should be invalidated for ${id}`,
			);
		}
	});

	it('does not treat non-style Astro queries, raw CSS, or type=style alone as style modules', () => {
		const nonStyleIds = [
			{ id: '/src/Component.astro?astro&type=script&index=0', file: '/src/Component.astro' },
			{ id: '/src/file.css?raw', file: '/src/file.css' },
			{ id: '/src/module.ts?type=style', file: '/src/module.ts' },
		];

		for (const mod of nonStyleIds) {
			const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
			const { environment, server, invalidatedModuleGraphIds } = createMockContext({
				modules: [mod],
				moduleGraphEntries: [[devCssId, { id: devCssId }]],
			});

			const hotUpdate = getHotUpdateHandler();

			const result = hotUpdate.call(
				{ environment },
				{
					modules: [mod],
					server,
					timestamp: Date.now(),
					file: mod.file,
				},
			);

			assert.deepEqual(result, []);
			assert.ok(
				!invalidatedModuleGraphIds.includes(devCssId),
				`dev-css module should not be invalidated for ${mod.id}`,
			);
		}
	});

	it('does not invalidate dev-css modules when no style modules are present', () => {
		const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';

		const { environment, server, invalidatedModuleGraphIds } = createMockContext({
			modules: [{ id: '/path/to/component.astro', file: '/path/to/component.astro' }],
			moduleGraphEntries: [[devCssId, { id: devCssId }]],
		});

		// The .astro file exists in the client module graph too
		server.environments.client.moduleGraph.getModuleById = (id: string) =>
			id === '/path/to/component.astro' ? { id } : null;

		const hotUpdate = getHotUpdateHandler();

		const result = hotUpdate.call(
			{ environment },
			{
				modules: [{ id: '/path/to/component.astro', file: '/path/to/component.astro' }],
				server,
				timestamp: Date.now(),
				file: '/path/to/component.astro',
			},
		);

		// For client-visible module changes, the handler returns [] to prevent default SSR propagation
		assert.deepEqual(result, []);

		// The dev-css module should NOT be invalidated (CSS invalidation is for style-only changes)
		assert.equal(invalidatedModuleGraphIds.length, 0);
	});

	it('returns empty array for CSS changes to prevent full page reload', () => {
		const { environment, server } = createMockContext({
			modules: [{ id: '/path/to/styles.css', file: '/path/to/styles.css' }],
		});

		const hotUpdate = getHotUpdateHandler();

		const result = hotUpdate.call(
			{ environment },
			{
				modules: [{ id: '/path/to/styles.css', file: '/path/to/styles.css' }],
				server,
				timestamp: Date.now(),
				file: '/path/to/styles.css',
			},
		);

		// Must return [] to prevent Vite's default SSR HMR propagation
		assert.deepEqual(result, []);
	});

	it('handles empty dev-css module map gracefully', () => {
		const { environment, server, invalidatedModuleGraphIds } = createMockContext({
			modules: [{ id: '/path/to/styles.css', file: '/path/to/styles.css' }],
			moduleGraphEntries: [],
		});

		const hotUpdate = getHotUpdateHandler();

		const result = hotUpdate.call(
			{ environment },
			{
				modules: [{ id: '/path/to/styles.css', file: '/path/to/styles.css' }],
				server,
				timestamp: Date.now(),
				file: '/path/to/styles.css',
			},
		);

		assert.deepEqual(result, []);
		assert.equal(invalidatedModuleGraphIds.length, 0);
	});
});
