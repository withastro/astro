import { preact, type PreactPluginOptions as VitePreactPluginOptions } from '@preact/preset-vite';
import type { AstroIntegration, AstroRenderer, ViteUserConfig } from 'astro';
import { fileURLToPath } from 'node:url';

const babelCwd = new URL('../', import.meta.url);

function getRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
	};
}

export type Options = Pick<VitePreactPluginOptions, 'include' | 'exclude'> & { compat?: boolean };

export default function ({ include, exclude, compat }: Options = {}): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, command }) => {
				const preactPlugin = preact({
					include,
					exclude,
					babel: {
						cwd: fileURLToPath(babelCwd),
					},
				});

				const viteConfig: ViteUserConfig = {
					optimizeDeps: {
						include: ['@astrojs/preact/client.js', 'preact', 'preact/jsx-runtime'],
						exclude: ['@astrojs/preact/server.js'],
					},
				};

				// If not compat, delete the plugin that does it
				if (!compat) {
					const pIndex = preactPlugin.findIndex((p) => p.name == 'preact:config');
					if (pIndex >= 0) {
						preactPlugin.splice(pIndex, 1);
					}
				} else {
					viteConfig.optimizeDeps!.include!.push(
						'preact/compat',
						'preact/test-utils',
						'preact/compat/jsx-runtime'
					);
					viteConfig.resolve = {
						alias: [{ find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }],
						dedupe: ['preact/compat', 'preact'],
					};
					// noExternal React entrypoints to be bundled, resolved, and aliased by Vite
					viteConfig.ssr = {
						noExternal: ['react', 'react-dom', 'react-dom/test-utils', 'react/jsx-runtime'],
					};
				}

				viteConfig.plugins = [preactPlugin];

				addRenderer(getRenderer(command === 'dev'));
				updateConfig({
					vite: viteConfig,
				});
			},
		},
	};
}
