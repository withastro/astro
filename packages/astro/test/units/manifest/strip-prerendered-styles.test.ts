import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripPrerenderedRouteStyles } from '../../../src/core/build/plugins/plugin-manifest.ts';
import type { SerializedSSRManifest } from '../../../src/core/app/types.ts';

describe('manifest - stripPrerenderedRouteStyles', () => {
	it('strips styles from prerendered routes in SSR manifest while preserving on-demand styles', () => {
		const mockManifest: Partial<SerializedSSRManifest> = {
			routes: [
				{
					file: 'src/pages/index.astro',
					links: [],
					scripts: [],
					styles: ['inline-style-1', 'inline-style-2'],
					routeData: {
						prerender: true,
						route: '/',
						component: 'src/pages/index.astro',
					} as any,
				},
				{
					file: 'src/pages/api.astro',
					links: [],
					scripts: [],
					styles: ['ssr-style-1'],
					routeData: {
						prerender: false,
						route: '/api',
						component: 'src/pages/api.astro',
					} as any,
				},
			],
		};

		const result = stripPrerenderedRouteStyles(mockManifest as SerializedSSRManifest);
		assert.equal(result.routes[0].styles.length, 0, 'prerendered route styles should be empty');
		assert.equal(result.routes[1].styles.length, 1, 'SSR route styles should be preserved');
		assert.equal(result.routes[1].styles[0], 'ssr-style-1');
	});
});
