import { RouterRegistry } from '@astrojs/vite-plugin-router/_internal/registry.js';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import astroPluginRoutes from '@astrojs/vite-plugin-router/_internal/vite-plugin-routes/index.js';
import type { ResolvedConfig } from 'vite';
import { toRouterConfig } from '../../../dist/core/router-config.js';
import { defaultLogger, createBasicSettings } from '../test-utils.ts';
import { makeRoute, staticPart } from './test-helpers.ts';

describe('astro:routes virtual module', () => {
	it('imports deserializeRouteInfo from the manifest module to avoid a circular dependency through a barrel', async () => {
		const settings = await createBasicSettings();
		const route = makeRoute({
			segments: [[staticPart('')]],
			trailingSlash: 'ignore',
			route: '/',
			pathname: '/',
		});
		const routesList = { routes: [route] };

		const routerRegistry = new RouterRegistry(() => toRouterConfig(settings));
		routerRegistry.reset({} as ResolvedConfig);
		const plugin = astroPluginRoutes({
			routerRegistry,
			logger: defaultLogger,
			routesList,
			hostRoutes: true,
			command: 'dev',
			createRoutes: async () => routesList,
			isRouteFile: () => false,
		});
		const configResolved = plugin.configResolved as { handler: () => Promise<void> };
		await configResolved.handler();

		const loadHook = plugin.load;
		const handler = typeof loadHook === 'function' ? loadHook : loadHook?.handler;
		assert.ok(handler, 'plugin should have a load handler');

		// Call the handler with a mock `this` providing the environment name.
		// Only `environment.name` is accessed; cast to satisfy the type checker.
		const rawResult = handler.call(
			{ environment: { name: 'astro' } } as any,
			'\0virtual:astro:routes',
		);
		const result = await rawResult;

		assert.ok(result, 'load handler should return a result');
		const code = typeof result === 'string' ? result : result.code;

		assert.match(
			code,
			/import \{ deserializeRouteInfo \} from "[^"]*\/core\/app\/manifest\.js"/,
			`Generated code should import from the manifest module. Got:\n${code}`,
		);
	});
});
