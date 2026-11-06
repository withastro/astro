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
		clientModuleIds?: string[];
	}) {
		const invalidatedModuleGraphIds: string[] = [];
		const wsMessages: unknown[] = [];

		const moduleGraphEntries = new Map<string, { id: string }>(options.moduleGraphEntries ?? []);
		const clientModuleIds = new Set(options.clientModuleIds ?? []);

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
						getModuleById: (id: string) => (clientModuleIds.has(id) ? { id } : null),
						getModulesByFile: (file: string) => {
							const modules = [...clientModuleIds]
								.filter((id) => id.split('?', 1)[0] === file)
								.map((id) => ({ id, file }));
							return modules.length > 0 ? new Set(modules) : undefined;
						},
					},
				},
			},
			ws: { send: (message: unknown) => wsMessages.push(message) },
		};

		return {
			environment,
			server,
			invalidatedModuleGraphIds,
			wsMessages,
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
			clientModuleIds: ['/path/to/global.css'],
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
			clientModuleIds: ['/path/to/styles.scss'],
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

	it('invalidates dev-css modules for component style block virtual modules', () => {
		const styleBlockIds = [
			'/src/Component.astro?astro&type=style&index=0&lang.css',
			'/src/Component.astro?type=style&astro&index=0&lang.scss',
			'/src/Component.astro?index=1&lang.less&type=style&astro',
			'/src/MotionOneNav.svelte?svelte&type=style&lang.css',
			'/src/VueCounter.vue?vue&type=style&index=0&lang.css',
		];

		for (const id of styleBlockIds) {
			const file = id.split('?', 1)[0];
			const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
			const { environment, server, invalidatedModuleGraphIds } = createMockContext({
				modules: [{ id, file }],
				moduleGraphEntries: [[devCssId, { id: devCssId }]],
				clientModuleIds: [id],
			});

			const hotUpdate = getHotUpdateHandler();

			const result = hotUpdate.call(
				{ environment },
				{
					modules: [{ id, file }],
					server,
					timestamp: Date.now(),
					file,
				},
			);

			assert.deepEqual(result, []);
			assert.ok(
				invalidatedModuleGraphIds.includes(devCssId),
				`dev-css module should be invalidated for ${id}`,
			);
		}
	});

	it('uses SSR invalidation for component styles missing an exact client module', () => {
		for (const { id, clientModuleIds } of [
			{
				id: '/src/Component.astro?astro&type=style&index=0&lang.css',
				clientModuleIds: ['/src/Component.astro?astro&type=style&index=1&lang.css'],
			},
			{ id: '/src/MotionOneNav.svelte?svelte&type=style&lang.css', clientModuleIds: [] },
		]) {
			const file = id.split('?', 1)[0];
			const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
			const { environment, server, invalidatedModuleGraphIds, wsMessages } = createMockContext({
				modules: [{ id, file }],
				moduleGraphEntries: [[devCssId, { id: devCssId }]],
				clientModuleIds,
			});

			const hotUpdate = getHotUpdateHandler();

			const result = hotUpdate.call(
				{ environment },
				{
					modules: [{ id, file }],
					server,
					timestamp: Date.now(),
					file,
				},
			);

			assert.deepEqual(result, []);
			assert.ok(
				invalidatedModuleGraphIds.includes(id),
				`${id} should be invalidated through the SSR path`,
			);
			assert.ok(
				invalidatedModuleGraphIds.includes(devCssId),
				'SSR-only style block modules should also invalidate dev-css before reloading',
			);
			assert.deepEqual(wsMessages, [{ type: 'full-reload' }]);
		}
	});

	it('matches inline component style requests to their client style module', () => {
		const clientStyleId = '/src/MotionOneNav.svelte?svelte&type=style&lang.css';
		const serverStyleIds = [
			'/src/MotionOneNav.svelte?inline&svelte&type=style&lang.css',
			'/src/MotionOneNav.svelte?svelte&inline&type=style&lang.css',
			'/src/MotionOneNav.svelte?svelte&type=style&lang.css&inline',
		];

		for (const serverStyleId of serverStyleIds) {
			const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
			const { environment, server, invalidatedModuleGraphIds, wsMessages } = createMockContext({
				modules: [{ id: serverStyleId, file: '/src/MotionOneNav.svelte' }],
				moduleGraphEntries: [[devCssId, { id: devCssId }]],
				clientModuleIds: [clientStyleId],
			});

			const hotUpdate = getHotUpdateHandler();

			const result = hotUpdate.call(
				{ environment },
				{
					modules: [{ id: serverStyleId, file: '/src/MotionOneNav.svelte' }],
					server,
					timestamp: Date.now(),
					file: '/src/MotionOneNav.svelte',
				},
			);

			assert.deepEqual(result, []);
			assert.ok(
				invalidatedModuleGraphIds.includes(devCssId),
				'dev-css module should be invalidated when client style HMR can apply the update',
			);
			assert.ok(!invalidatedModuleGraphIds.includes(serverStyleId));
			assert.deepEqual(wsMessages, []);
		}
	});

	it('uses SSR invalidation for CSS files missing an exact client module', () => {
		const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
		const { environment, server, invalidatedModuleGraphIds, wsMessages } = createMockContext({
			modules: [{ id: '/path/to/global.css', file: '/path/to/global.css' }],
			moduleGraphEntries: [[devCssId, { id: devCssId }]],
			clientModuleIds: ['/path/to/global.css?inline'],
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

		assert.deepEqual(result, []);
		assert.ok(
			invalidatedModuleGraphIds.includes('/path/to/global.css'),
			'CSS files missing from the client graph should be invalidated through the SSR path',
		);
		assert.ok(
			invalidatedModuleGraphIds.includes(devCssId),
			'CSS files missing from the client graph should also invalidate dev-css before reloading',
		);
		assert.deepEqual(wsMessages, [{ type: 'full-reload' }]);
	});

	it('uses SSR invalidation for CSS string imports', () => {
		for (const id of ['/path/to/global.css?raw', '/path/to/global.css?inline']) {
			const devCssId = '\0virtual:astro:dev-css:src/pages/index@_@astro';
			const { environment, server, invalidatedModuleGraphIds, wsMessages } = createMockContext({
				modules: [{ id, file: '/path/to/global.css' }],
				moduleGraphEntries: [[devCssId, { id: devCssId }]],
				clientModuleIds: [id],
			});

			const hotUpdate = getHotUpdateHandler();

			const result = hotUpdate.call(
				{ environment },
				{
					modules: [{ id, file: '/path/to/global.css' }],
					server,
					timestamp: Date.now(),
					file: '/path/to/global.css',
				},
			);

			assert.deepEqual(result, []);
			assert.ok(invalidatedModuleGraphIds.includes(id));
			assert.ok(!invalidatedModuleGraphIds.includes(devCssId));
			assert.deepEqual(wsMessages, [{ type: 'full-reload' }]);
		}
	});

	it('does not treat component scripts or incomplete style queries as style modules', () => {
		const nonStyleIds = [
			{ id: '/src/Component.astro?astro&type=script&index=0', file: '/src/Component.astro' },
			{ id: '/src/Component.svelte?svelte&type=script&lang.ts', file: '/src/Component.svelte' },
			{ id: '/src/Component.svelte?type=style&lang.css', file: '/src/Component.svelte' },
			{ id: '/src/module.ts?type=style', file: '/src/module.ts' },
			{ id: '/src/module.ts?type=style&lang.css', file: '/src/module.ts' },
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
			clientModuleIds: ['/path/to/styles.css'],
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
			clientModuleIds: ['/path/to/styles.css'],
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
