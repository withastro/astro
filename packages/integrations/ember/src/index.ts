import type { AstroIntegration, AstroRenderer, ContainerRenderer } from 'astro';
import { extensions, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// can be replaced with import.meta.dirname when node22 is minsupported
const here = dirname(fileURLToPath((import.meta.url)));

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/ember',
		clientEntrypoint: '@astrojs/ember/client.js',
		serverEntrypoint: '@astrojs/ember/server.js',
	};
}

export function getContainerRenderer(): ContainerRenderer {
	return {
		name: '@astrojs/ember',
		serverEntrypoint: '@astrojs/ember/server.js',
	};
}

export default function emberIntegration(options?: unknown): AstroIntegration {
	return {
		name: '@astrojs/ember',
		hooks: {
			'astro:config:setup': async ({ updateConfig, addRenderer }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: {
						optimizeDeps: {
							include: ['@astrojs/ember/client.js'],
							exclude: ['@astrojs/ember/server.js'],
						},
						plugins: [
							ember(),
							babel({
								babelHelpers: 'runtime',
								extensions,
								configFile: resolve(here, '../babel.config.cjs'),
							}),
						],
					},
				});
			},
		},
	};
}

