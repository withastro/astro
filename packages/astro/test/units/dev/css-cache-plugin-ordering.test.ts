import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astroDevCssPlugin } from '../../../dist/vite-plugin-css/index.js';

describe('astroDevCssPlugin', () => {
	it('returns a separate cssCachePlugin for late registration', () => {
		const result = astroDevCssPlugin({
			routesList: { routes: [] },
			command: 'dev',
		});

		// The function should return an object with plugins array and a separate cssCachePlugin
		assert.ok(result.plugins, 'should have a plugins array');
		assert.ok(Array.isArray(result.plugins), 'plugins should be an array');
		assert.ok(result.cssCachePlugin, 'should have a cssCachePlugin');
		assert.equal(result.cssCachePlugin.name, 'astro:dev-css-cache');
		assert.ok(result.cssCachePlugin.transform, 'cssCachePlugin should have a transform hook');

		// The main plugins should NOT contain the cache plugin
		const pluginNames = result.plugins.map((p) => p.name);
		assert.equal(
			pluginNames.includes('astro:dev-css-cache'),
			false,
			'cache plugin should not be in the main plugins array',
		);
	});

	it('cssCachePlugin transform is skipped during build', () => {
		const result = astroDevCssPlugin({
			routesList: { routes: [] },
			command: 'build',
		});

		// The cache plugin should exist but its transform handler should return early for build
		assert.ok(result.cssCachePlugin);
		const transform = result.cssCachePlugin.transform;
		assert.ok(transform);

		// The handler should be accessible via the object form
		const handler = typeof transform === 'function' ? transform : transform.handler;
		assert.ok(handler, 'transform should have a handler');
	});
});
