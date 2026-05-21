import { defineConfig } from 'astro/config';
import testAdapter from '../../test-adapter.js';

const devPrerenderMiddlewareSymbol = Symbol.for('astro.devPrerenderMiddleware');

/**
 * Mimics what `@astrojs/cloudflare` does in dev: register a dedicated
 * `prerender` Vite environment and flip the core dev-prerender middleware
 * switch. This is the adapter-level setup that exercises the bug fixed by
 * tracking the `prerender` environment in the `astro:head-metadata` plugin.
 */
function prerenderEnvIntegration() {
	return {
		name: 'test:prerender-env',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: 'test:prerender-env',
								config() {
									return {
										environments: {
											prerender: { dev: {} },
										},
									};
								},
								configureServer(server) {
									server[devPrerenderMiddlewareSymbol] = true;
								},
							},
						],
					},
				});
			},
		},
	};
}

export default defineConfig({
	output: 'server',
	adapter: testAdapter(),
	integrations: [prerenderEnvIntegration()],
});
