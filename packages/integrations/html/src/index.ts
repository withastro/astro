import type { AstroIntegration, AstroRenderer } from 'astro';

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
		plugins: [{
			name: '@astrojs/html',
			transform(code: string, id: string) {
				if (!id.endsWith('.html')) return code;
				return `export default { ['@astrojs/html']: true, code: ${JSON.stringify(code) }}`
			}
		}],
	};
}

export default function createIntegration(): AstroIntegration {
	return {
		name: '@astrojs/html',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, addPageExtension }) => {
				addRenderer(
					getRenderer()
				)
				updateConfig({ vite: getViteConfiguration() });
				addPageExtension('.html');
			},
		},
	};
}
