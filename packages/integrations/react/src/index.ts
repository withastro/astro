import viteReact, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration, AstroRenderer } from 'astro';
import { getContainerRenderer as getContainerRendererImpl } from './container-renderer.js';
import react from './renderer.js';
import { getReactMajorVersion } from './version.js';

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'compiler'
> & {
	experimentalReactChildren?: boolean;
	/**
	 * Disable streaming in React components
	 */
	experimentalDisableStreaming?: boolean;
};

/**
 * The React integration: `@vitejs/plugin-react` plus the renderer from `@astrojs/react/renderer`.
 */
export default function (options: ReactIntegrationOptions = {}): AstroIntegration {
	if ('babel' in options) {
		throw new Error(
			'The @astrojs/react babel option has been removed. Configure @rolldown/plugin-babel in vite.plugins for custom Babel transforms.',
		);
	}
	const { include, exclude, compiler, experimentalReactChildren, experimentalDisableStreaming } =
		options;
	const reactRenderer = react({
		include,
		exclude,
		experimentalReactChildren,
		experimentalDisableStreaming,
	});

	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(reactRenderer);
				updateConfig({
					vite: {
						plugins: [
							viteReact({
								include,
								exclude: withDefaultExclude(exclude),
								compiler: compiler && {
									target: `${getReactMajorVersion()}` as '17' | '18' | '19',
									...(typeof compiler === 'object' ? compiler : {}),
								},
							}),
						],
					},
				});
				if (command === 'dev') {
					injectScript('before-hydration', viteReact.preambleCode.replace(`__BASE__`, '/'));
				}
			},
			'astro:config:done': ({ logger, config }) => {
				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);

				if (enabledKnownJsxRenderers.length > 1 && !include && !exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/react/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/react/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/react] Importing `getContainerRenderer` from `@astrojs/react` is deprecated. Import it from `@astrojs/react/container-renderer` instead.',
	);
	return getContainerRendererImpl();
}

/**
 * Adds the default exclusions to `exclude`. In Vite 8, @vitejs/plugin-react sets
 * jsxRefreshInclude/jsxRefreshExclude, which controls vite:oxc's JSX refresh filter. Without
 * excluding .astro, the filter matches .astro virtual module scripts (e.g.
 * Foo.astro?astro&type=script&index=0&lang.ts) and forces lang to 'js', causing OXC to fail
 * parsing TypeScript syntax like `import type`.
 */
function withDefaultExclude(
	exclude: ViteReactPluginOptions['exclude'],
): ViteReactPluginOptions['exclude'] {
	const defaultExclude = [/\.astro$/, /\/node_modules\//];
	if (!exclude) return defaultExclude;
	return Array.isArray(exclude) ? [...exclude, ...defaultExclude] : [exclude, ...defaultExclude];
}
