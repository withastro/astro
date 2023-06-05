import type { AstroAdapter, AstroConfig, AstroIntegration, RouteData } from 'astro';
import type { Args } from './netlify-functions.js';
import { createRedirects } from './shared.js';

export function netlifyStatic(): AstroIntegration {
	let _config: any;
	return {
		name: '@astrojs/netlify',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					build: {
						// Do not output HTML redirects because we are building a `_redirects` file.
						redirects: false,
					},
				});
			},
			'astro:config:done': ({ config }) => {
				_config = config;
			},
			'astro:build:done': async ({ dir, routes }) => {
				await createRedirects(_config, routes, dir, '', 'static');
			}
		}
	};
}
