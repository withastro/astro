import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	isMiddlewarePath,
	vitePluginMiddleware,
} from '../../../dist/core/middleware/vite-plugin.js';
import { createBasicSettings } from '../test-utils.ts';

describe('middleware HMR path matching', () => {
	it('matches middleware.ts (single-file pattern)', () => {
		assert.ok(isMiddlewarePath('middleware.ts'));
	});

	it('matches middleware.js', () => {
		assert.ok(isMiddlewarePath('middleware.js'));
	});

	it('matches middleware/index.ts (directory pattern)', () => {
		assert.ok(isMiddlewarePath('middleware/index.ts'));
	});

	it('matches middleware/test.ts (file inside middleware directory)', () => {
		assert.ok(isMiddlewarePath('middleware/test.ts'));
	});

	it('matches middleware/nested/deep.ts (nested file)', () => {
		assert.ok(isMiddlewarePath('middleware/nested/deep.ts'));
	});

	it('does not match middleware-utils.ts (similarly named file)', () => {
		assert.ok(!isMiddlewarePath('middleware-utils.ts'));
	});

	it('does not match pages/middleware.ts (wrong directory)', () => {
		assert.ok(!isMiddlewarePath('pages/middleware.ts'));
	});

	it('does not match other unrelated files', () => {
		assert.ok(!isMiddlewarePath('components/Header.astro'));
	});
});

describe('middleware HMR hotUpdate handler', () => {
	async function getHandler() {
		const settings = await createBasicSettings();
		const plugin = vitePluginMiddleware({ settings });
		const hook = plugin.hotUpdate;
		const handler = typeof hook === 'function' ? hook : hook?.handler;
		assert.ok(handler, 'plugin should expose a hotUpdate handler');
		return handler;
	}

	function fakeEnvironment(name = 'ssr') {
		const virtualMod = { id: '\0virtual:astro:middleware' };
		const invalidated: unknown[] = [];
		const sent: string[] = [];
		return {
			environment: {
				name,
				moduleGraph: {
					getModuleById: () => virtualMod,
					invalidateModule: (mod: unknown) => invalidated.push(mod),
				},
				hot: { send: (event: string) => sent.push(event) },
			},
			invalidated,
			sent,
		};
	}

	it('invalidates the middleware when the change matched modules', async () => {
		const handler = await getHandler();
		const { environment, invalidated, sent } = fakeEnvironment();

		handler.call(
			{ environment } as any,
			{
				modules: [{ id: '/src/middleware.ts' }],
			} as any,
		);

		assert.equal(invalidated.length, 1);
		assert.deepEqual(sent, ['astro:middleware-updated']);
	});

	it('invalidates the middleware for unrelated in-graph changes too', async () => {
		const handler = await getHandler();
		const { environment, invalidated, sent } = fakeEnvironment();

		handler.call(
			{ environment } as any,
			{
				// A change that matched modules in the graph is not filtered: it
				// could be a transitive import of the middleware, so the handler
				// invalidates unless the change matched no modules at all.
				modules: [{ id: '/src/pages/index.astro' }],
			} as any,
		);

		assert.equal(invalidated.length, 1);
		assert.deepEqual(sent, ['astro:middleware-updated']);
	});

	it("doesn't invalidate the middleware when the change matched no modules", async () => {
		const handler = await getHandler();
		const { environment, invalidated, sent } = fakeEnvironment();

		handler.call({ environment } as any, { modules: [] } as any);

		assert.equal(invalidated.length, 0);
		assert.equal(sent.length, 0);
	});

	it('ignores hotUpdates outside server environments', async () => {
		const handler = await getHandler();
		const { environment, invalidated, sent } = fakeEnvironment('client');

		handler.call(
			{ environment } as any,
			{
				modules: [{ id: '/src/middleware.ts' }],
			} as any,
		);

		assert.equal(invalidated.length, 0);
		assert.equal(sent.length, 0);
	});
});
