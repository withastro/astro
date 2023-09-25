// @ts-check
import { fileURLToPath } from 'node:url';

export * from '../test-utils.js';

/**
 *
 * @returns {import('astro').AstroIntegration}
 */
export function testIntegration({ setEntryPoints } = {}) {
	return {
		name: '@astrojs/netlify/test-integration',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						resolve: {
							alias: {
								'@astrojs/netlify/netlify-functions.js': fileURLToPath(
									new URL('../../dist/netlify-functions.js', import.meta.url)
								),
							},
						},
					},
				});
			},
			'astro:build:ssr': ({ entryPoints }) => {
				if (entryPoints.size) {
					setEntryPoints(entryPoints);
				}
			},
		},
	};
}
