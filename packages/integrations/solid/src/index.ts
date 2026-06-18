import type { AstroIntegration, AstroIntegrationLogger, AstroRenderer } from 'astro';
import type { PluginOption, Plugin } from 'vite';
import solid, { type Options as ViteSolidPluginOptions } from 'vite-plugin-solid';
import { getContainerRenderer as getContainerRendererImpl } from './container-renderer.js';

// TODO: keep in sync with https://github.com/thetarnav/solid-devtools/blob/main/packages/main/src/vite/index.ts#L7
type DevtoolsPluginOptions = {
	/** Add automatic name when creating signals, memos, stores, or mutables */
	autoname?: boolean;
	locator?:
		| boolean
		| {
				/** Choose in which IDE the component source code should be revealed. */
				targetIDE?: string;
				/**
				 * Holding which key should enable the locator overlay?
				 * @default 'Alt'
				 */
				key?: string;
				/** Inject location attributes to jsx templates */
				jsxLocation?: boolean;
				/** Inject location information to component declarations */
				componentLocation?: boolean;
		  };
};
type DevtoolsPlugin = (_options?: DevtoolsPluginOptions) => PluginOption;

async function getDevtoolsPlugin(logger: AstroIntegrationLogger, retrieve: boolean) {
	if (!retrieve) {
		return null;
	}

	try {
		// @ts-ignore
		return (await import('solid-devtools/vite')).default as DevtoolsPlugin;
	} catch (_) {
		logger.warn(
			'Solid Devtools requires `solid-devtools` as a peer dependency, add it to your project.',
		);
		return null;
	}
}

function getViteConfiguration(
	{ include, exclude }: Options,
	devtoolsPlugin: DevtoolsPlugin | null,
) {
	const plugins: PluginOption[] = [
		solid({ include, exclude, ssr: true }),
		configEnvironmentPlugin(),
	];

	if (devtoolsPlugin) {
		plugins.push(devtoolsPlugin({ autoname: true }));
	}

	return { plugins };
}

/**
 * @deprecated Import `getContainerRenderer` from `@astrojs/solid-js/container-renderer` instead.
 */
export function getContainerRenderer(): AstroRenderer {
	console.warn(
		'[@astrojs/solid-js] Importing `getContainerRenderer` from `@astrojs/solid-js` is deprecated. Import it from `@astrojs/solid-js/container-renderer` instead.',
	);
	return getContainerRendererImpl();
}

export interface Options extends Pick<ViteSolidPluginOptions, 'include' | 'exclude'> {
	devtools?: boolean;
}

export default function (options: Options = {}): AstroIntegration {
	return {
		name: '@astrojs/solid-js',
		hooks: {
			'astro:config:setup': async ({
				command,
				addRenderer,
				updateConfig,
				injectScript,
				logger,
			}) => {
				const devtoolsPlugin = await getDevtoolsPlugin(
					logger,
					!!options.devtools && command === 'dev',
				);

				addRenderer(getContainerRendererImpl());
				updateConfig({
					vite: getViteConfiguration(options, devtoolsPlugin),
				});

				if (devtoolsPlugin) {
					injectScript('page', 'import "solid-devtools";');
				}
			},
			'astro:config:done': ({ logger, config }) => {
				const knownJsxRenderers = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
				const enabledKnownJsxRenderers = config.integrations.filter((renderer) =>
					knownJsxRenderers.includes(renderer.name),
				);

				if (enabledKnownJsxRenderers.length > 1 && !options.include && !options.exclude) {
					logger.warn(
						'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/solid-js/#combining-multiple-jsx-frameworks for more information.',
					);
				}
			},
		},
	};
}

function configEnvironmentPlugin(): Plugin {
	return {
		name: '@astrojs/solid:config-environment',
		configEnvironment(environmentName) {
			return {
				optimizeDeps: {
					include: environmentName === 'client' ? ['@astrojs/solid-js/client.js'] : [],
					exclude: ['@astrojs/solid-js/server.js'],
				},
			};
		},
	};
}
