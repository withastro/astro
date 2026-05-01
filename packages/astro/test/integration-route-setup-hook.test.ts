import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.ts';

describe('Routes setup hook', () => {
	it('should work in dev', async () => {
		const routes: Array<{ component: string; prerender: boolean | undefined }> = [];
		const fixture = await loadFixture({
			root: './fixtures/dev-render/',
			integrations: [
				{
					name: 'test',
					hooks: {
						'astro:route:setup': (params) => {
							routes.push({
								component: params.route.component,
								prerender: params.route.prerender,
							});
						},
					},
				},
			],
		});
		const devServer = await fixture.startDevServer();

		try {
			// The hook should have been called for each route during startup.
			// Filter to just the project pages we know about.
			const projectRoutes = routes
				.filter((r) => r.component.startsWith('src/pages/'))
				.sort((a, b) => a.component.localeCompare(b.component));

			assert.ok(projectRoutes.length > 0, 'Should have collected routes');
			// All routes in a static project should be prerendered by default
			for (const route of projectRoutes) {
				assert.equal(route.prerender, true, `${route.component} should be prerendered`);
			}
		} finally {
			await devServer.stop();
		}
	});
});
