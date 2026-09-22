import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';
import {
	createRunnableEnvironment,
	getDevRenderers,
} from '../../../dist/vite-plugin-app/environment.js';
import { createBasicSettings } from '../test-utils.ts';
import { createManifest } from '../app/test-helpers.ts';
import { createRouteData } from '../mocks.ts';

/**
 * Creates a minimal ModuleLoader stub. The `import` callback controls what
 * `loadRenderer` and `loader.import` receive.
 */
function stubLoader(
	importFn = async () => ({ default: { check() {}, renderToStaticMarkup() {} } }),
) {
	return {
		import: importFn,
		resolveId: async () => undefined,
		getModuleById: () => undefined,
		getModulesByFile: () => undefined,
		getModuleInfo: () => null,
		eachModule() {},
		invalidateModule() {},
		fixStacktrace() {},
		clientReload() {},
		webSocketSend() {},
		isHttps: () => false,
		events: new EventEmitter(),
		getSSREnvironment: () => {
			throw new Error('not implemented in stub');
		},
	};
}

describe('createRunnableEnvironment', () => {
	it('loads renderers for built-in routes like server islands', async () => {
		const settings = await createBasicSettings();
		// Add a fake renderer that loadRenderer will resolve via the stub loader
		settings.renderers.push({
			name: 'test-renderer',
			serverEntrypoint: 'test-renderer/server.js',
		});

		const manifest = createManifest();
		const loader = stubLoader();

		const env = createRunnableEnvironment({
			loader: loader as any,
			settings,
			getDebugInfo: async () => '',
		});

		// Server island built-in route
		const routeData = createRouteData({
			route: '/_server-islands/[name]',
			component: '_server-islands.astro',
		});

		// Before the call, no renderers should be set for this manifest
		assert.equal(getDevRenderers(manifest).length, 0);

		// Call getComponentByRoute with the server island route
		await env.getComponentByRoute(manifest, routeData);

		// After the call, renderers should be populated even for built-in routes
		const renderers = getDevRenderers(manifest);
		assert.equal(renderers.length, 1);
		assert.equal(renderers[0].name, 'test-renderer');
	});
});
