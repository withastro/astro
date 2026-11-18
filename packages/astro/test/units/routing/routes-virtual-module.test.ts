import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import astroPluginRoutes from '../../../dist/vite-plugin-routes/index.js';
import { defaultLogger, createBasicSettings } from '../test-utils.ts';
import { makeRoute, staticPart } from './test-helpers.ts';

describe('astro:routes virtual module', () => {
	it('imports deserializeRouteInfo from astro/app/manifest to avoid a circular dependency through the barrel', async () => {
		const settings = await createBasicSettings();
		const route = makeRoute({
			segments: [[staticPart('')]],
			trailingSlash: 'ignore',
			route: '/',
			pathname: '/',
		});
		const routesList = { routes: [route] };

		const plugin = await astroPluginRoutes({
			settings,
			logger: defaultLogger,
			routesList,
			command: 'dev',
		});

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

		assert.ok(
			code.includes("from 'astro/app/manifest'"),
			`Generated code should import from 'astro/app/manifest', not from 'astro/app' barrel. Got:\n${code}`,
		);
		assert.ok(
			!code.includes("from 'astro/app';"),
			`Generated code should NOT import from 'astro/app' barrel (circular dependency). Got:\n${code}`,
		);
	});
});
