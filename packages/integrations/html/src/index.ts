import type { AstroIntegration, AstroRenderer } from 'astro';
import { transform } from './transform/index.js';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/html',
		serverEntrypoint: './dist/server.js',
	};
}

function getViteConfiguration() {
	return {
		optimizeDeps: {
			exclude: ['@astrojs/html/dist/server.js'],
		},
		ssr: {
			external: ['@astrojs/html/dist/server.js']
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
