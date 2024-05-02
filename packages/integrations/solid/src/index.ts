import type { AstroIntegration, AstroRenderer } from 'astro';
import solid, { type Options as ViteSolidPluginOptions } from 'vite-plugin-solid';
import type { UserConfig } from 'vite';

async function getViteConfiguration(isDev: boolean, { include, exclude, devtools }: Options) {
	// https://github.com/solidjs/vite-plugin-solid
	// We inject the dev mode only if the user explicitly wants it or if we are in dev (serve) mode
	const nestedDeps = ['solid-js', 'solid-js/web', 'solid-js/store', 'solid-js/html', 'solid-js/h'];
	const config: UserConfig = {
		resolve: {
			conditions: ['solid', ...(isDev ? ['development'] : [])],
			dedupe: nestedDeps,
			alias: [{ find: /^solid-refresh$/, replacement: '/@solid-refresh' }],
		},
		optimizeDeps: {
			include: [...nestedDeps],
			exclude: ['@astrojs/solid-js/server.js'],
		},
		plugins: [
			solid({ include, exclude, dev: isDev, ssr: true }),
			{
				name: '@astrojs/solid:config-overrides',
				enforce: 'post',
				config() {
					return {
						esbuild: {
							// To support using alongside other JSX frameworks, still let
							// esbuild compile stuff. Solid goes first anyways.
							include: /\.(m?ts|[jt]sx)$/,
						},
					};
				},
			},
		],
		ssr: {
			external: ['babel-preset-solid'],
		},
	};

	if (devtools && isDev) {
		const solidDevtools = (await import('solid-devtools/vite')).default;
		config.plugins?.push(solidDevtools({ autoname: true }));
	}

	return config
}

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/solid-js',
		clientEntrypoint: '@astrojs/solid-js/client.js',
		serverEntrypoint: '@astrojs/solid-js/server.js',
	};
}

export interface Options extends Pick<ViteSolidPluginOptions, 'include' | 'exclude'> {
	devtools?: boolean;
}

export default function (options: Options = {}): AstroIntegration {
	return {
		name: '@astrojs/solid-js',
		hooks: {
			'astro:config:setup': async ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer());
				updateConfig({
					vite: await getViteConfiguration(command === 'dev', options),
				});

				if (options.devtools && command === 'dev') {
					injectScript('page', 'import "solid-devtools";');
				}
			},
		},
	};
}
