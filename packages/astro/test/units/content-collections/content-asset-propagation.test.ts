import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { astroContentAssetPropagationPlugin } from '../../../dist/content/vite-plugin-content-assets.js';

describe('astroContentAssetPropagationPlugin', () => {
	it('does not emit a module-level directive in propagated asset modules', async () => {
		const settings = { config: { root: new URL('file:///fake/') } };
		const plugin = astroContentAssetPropagationPlugin({ settings: settings as any }) as any;

		// Simulate a build-time transform (no dev environment) for a propagated asset module
		const id = '/src/content/docs/index.mdx?astroPropagatedAssets';
		const context = {
			environment: { name: 'prerender' },
		};

		const result = await plugin.transform.handler.call(context, '', id);

		assert.ok(result, 'transform should return a result for propagated asset modules');
		assert.ok(
			!result.code.includes('"use astro:head-inject"'),
			'generated code must not contain the "use astro:head-inject" directive',
		);
		assert.ok(
			result.code.includes('__astroPropagation'),
			'generated code should still contain the propagation marker',
		);
	});
});
