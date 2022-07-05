import type { AstroIntegration, AstroRenderer } from 'astro';
import { readFileSync } from 'fs';
import { transform } from './transform.js';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/html',
		serverEntrypoint: '@astrojs/html/server.js',
	};
}

function getViteConfiguration() {
	return {
		optimizeDeps: {
			exclude: ['@astrojs/html/server.js'],
		},
		plugins: [
			{
				name: '@astrojs/html',
				options(options: any) {
					options.plugins = options.plugins?.filter((p: any) => p.name !== 'vite:build-html');
				},
				async transform(source: string, id: string) {
					if (!id.endsWith('.html')) return;
					return await transform(source, id);
				}
			}
		],
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@astrojs/html',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, addPageExtension }) => {
				addRenderer(getRenderer())
				updateConfig({ vite: getViteConfiguration() });
				addPageExtension('.html');
			}
		},
	};
}
