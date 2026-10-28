import { fileURLToPath } from 'node:url';
import { preact, type PreactPluginOptions as VitePreactPluginOptions } from '@preact/preset-vite';
import type { AstroIntegration, AstroRenderer, ViteUserConfig } from 'astro';
import {
	getContainerRenderer as getContainerRendererImpl,
	getRenderer,
} from './container-renderer.js';
import preactRenderer from './renderer.js';

const babelCwd = new URL('../', import.meta.url);

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/preact/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/preact] Importing `getContainerRenderer` from `@astrojs/preact` is deprecated. Import it from `@astrojs/preact/container-renderer` instead.',
	);
	return getContainerRendererImpl();
}

export interface Options extends Pick<VitePreactPluginOptions, 'include' | 'exclude' | 'babel'> {
	compat?: boolean;
	devtools?: boolean;
}

/**
 * The Preact integration: `@preact/preset-vite` plus the renderer from `@astrojs/preact/renderer`.
 */
export default function ({
	include,
	exclude,
	compat,
	devtools,
	babel,
}: Options = {}): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, command, injectScript }) => {
				const preactPlugin = preact({
					reactAliasesEnabled: compat ?? false,
					include,
					exclude,
					babel: {
						...babel,
						cwd: fileURLToPath(babelCwd),
					},
				});

				const viteConfig: ViteUserConfig = {
					optimizeDeps: {
						// Ideally would be environment config, but
						// putting it there does not result in it being optimized
						include: ['@astrojs/preact/server.js'],
					},
				};

				viteConfig.plugins = [preactPlugin];

				addRenderer({
					...preactRenderer({ include, exclude, compat, devtools }),
					// `client-dev.js` loads `preact/debug` with the first island.
					clientEntrypoint: getRenderer(command === 'dev').clientEntrypoint,
				});
				updateConfig({
					vite: viteConfig,
				});

				if (command === 'dev' && devtools) {
					injectScript('page', 'import "preact/debug";');
				}
			},
			'astro:config:done': ({ logger, config }) => {
				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);

				if (enabledKnownJsxRenderers.length > 1 && !include && !exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/preact/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}
