import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { init, parse } from 'es-module-lexer/minimal';
import { vitePluginCacheProvider } from '../../dist/core/cache/vite-plugin.js';
import { vitePluginFetchable } from '../../dist/core/fetch/vite-plugin.js';
import { vitePluginMiddleware } from '../../dist/core/middleware/vite-plugin.js';
import { vitePluginSessionDriver } from '../../dist/core/session/vite-plugin.js';

const root = new URL("./arc's site/", import.meta.url);
const resolvedPath = "/projects/arc's site/node_modules/some-module/index.js";
const context = { resolve: async () => ({ id: resolvedPath }) };

async function loadVirtualModule(plugin: any, resolvedId: string) {
	await plugin.resolveId.handler.call(context, resolvedId.slice(1));
	return (await plugin.load.handler.call(context, resolvedId)).code as string;
}

describe('virtual modules that import a resolved path', () => {
	const settings = {
		config: {
			root,
			srcDir: new URL('src/', root),
			session: { driver: 'fs-lite' },
			cache: { provider: { entrypoint: 'some-module' } },
		},
		middlewares: { pre: [resolvedPath], post: [] },
	} as never;

	const cases = [
		['session driver', vitePluginSessionDriver, '\0virtual:astro:session-driver'],
		['cache provider', vitePluginCacheProvider, '\0virtual:astro:cache-provider'],
		['fetch handler', vitePluginFetchable, '\0virtual:astro:fetchable'],
		['middleware', vitePluginMiddleware, '\0virtual:astro:middleware'],
	] as const;

	for (const [name, createPlugin, resolvedId] of cases) {
		it(`${name} imports a path that contains an apostrophe`, async () => {
			const code = await loadVirtualModule(createPlugin({ settings }), resolvedId);
			await init();
			const [imports] = parse(code);
			const specifiers = imports.map((entry) => entry.n).filter((n) => n !== 'astro:middleware');
			assert.ok(specifiers.length > 0);
			for (const specifier of specifiers) {
				assert.equal(specifier, resolvedPath);
			}
		});
	}
});
