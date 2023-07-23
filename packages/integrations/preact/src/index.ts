import type { AstroIntegration, AstroRenderer } from 'astro';
import preact, {type PreactPluginOptions as VitePreactPluginOptions} from '@preact/preset-vite';

function getRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
	};
}

export type Options =Pick<VitePreactPluginOptions, 'include' | 'exclude'> & { compat?: boolean };
// TODO: Add back compat support -- how would this work in the new world?
export default function ({include, exclude, compat}: Options = {}): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, command }) => {
				const preactPlugin = preact({include, exclude});

				// If not compat, delete the plugin that does it
				if(!compat) {
					const pIndex = preactPlugin.findIndex(p => p.name == 'preact:config');
					if (pIndex >= 0) {
						preactPlugin.splice(pIndex, 1);
					}
				}

				addRenderer(getRenderer(command === 'dev'));
				updateConfig({
					vite: {
						plugins: [preactPlugin],
						optimizeDeps: {
							include: ['@astrojs/preact/client.js', 'preact', 'preact/jsx-runtime'],
							exclude: ['@astrojs/preact/server.js'],
						},
					},
				});
			},
		},
	};
}
