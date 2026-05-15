import solid from 'vite-plugin-solid';
async function getDevtoolsPlugin(logger, retrieve) {
	if (!retrieve) {
		return null;
	}
	try {
		return (await import('solid-devtools/vite')).default;
	} catch (_) {
		logger.warn(
			'Solid Devtools requires `solid-devtools` as a peer dependency, add it to your project.',
		);
		return null;
	}
}
function getViteConfiguration({ include, exclude }, devtoolsPlugin) {
	const config = {
		plugins: [solid({ include, exclude, ssr: true }), configEnvironmentPlugin()],
	};
	if (devtoolsPlugin) {
		config.plugins?.push(devtoolsPlugin({ autoname: true }));
	}
	return config;
}
function getRenderer() {
	return {
		name: '@astrojs/solid-js',
		clientEntrypoint: '@astrojs/solid-js/client.js',
		serverEntrypoint: '@astrojs/solid-js/server.js',
	};
}
function index_default(options = {}) {
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
				addRenderer(getRenderer());
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
function configEnvironmentPlugin() {
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
export { index_default as default, getRenderer as getContainerRenderer };
