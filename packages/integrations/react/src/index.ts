import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration } from 'astro';
import { version as ReactVersion } from 'react-dom';
import type * as vite from 'vite';

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
};

const FAST_REFRESH_PREAMBLE = react.preambleCode;

const versionsConfig = {
	17: {
		server: '@astrojs/react/server-v17.js',
		client: '@astrojs/react/client-v17.js',
		externals: ['react-dom/server.js', 'react-dom/client.js'],
	},
	18: {
		server: '@astrojs/react/server.js',
		client: '@astrojs/react/client.js',
		externals: ['react-dom/server', 'react-dom/client'],
	},
	19: {
		server: '@astrojs/react/server.js',
		client: '@astrojs/react/client.js',
		externals: ['react-dom/server', 'react-dom/client'],
	},
};

type SupportedReactVersion = keyof typeof versionsConfig;
type ReactVersionConfig = (typeof versionsConfig)[SupportedReactVersion];

function getReactMajorVersion(): number {
	const matches = /\d+\./.exec(ReactVersion);
	if (!matches) {
		return NaN;
	}
	return Number(matches[0]);
}

function isUnsupportedVersion(majorVersion: number) {
	return majorVersion < 17 || majorVersion > 19 || Number.isNaN(majorVersion);
}

function getRenderer(reactConfig: ReactVersionConfig) {
	return {
		name: '@astrojs/react',
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}

function optionsPlugin(experimentalReactChildren: boolean): vite.Plugin {
	const virtualModule = 'astro:react:opts';
	const virtualModuleId = '\0' + virtualModule;
	return {
		name: '@astrojs/react:opts',
		resolveId(id) {
			if (id === virtualModule) {
				return virtualModuleId;
			}
		},
		load(id) {
			if (id === virtualModuleId) {
				return {
					code: `export default {
						experimentalReactChildren: ${JSON.stringify(experimentalReactChildren)}
					}`,
				};
			}
		},
	};
}

function getViteConfiguration(
	{ include, exclude, babel, experimentalReactChildren }: ReactIntegrationOptions = {},
	reactConfig: ReactVersionConfig
) {
	return {
		optimizeDeps: {
			include: [
				reactConfig.client,
				'react',
				'react/jsx-runtime',
				'react/jsx-dev-runtime',
				'react-dom',
			],
			exclude: [reactConfig.server],
		},
		plugins: [react({ include, exclude, babel }), optionsPlugin(!!experimentalReactChildren)],
		resolve: {
			dedupe: ['react', 'react-dom', 'react-dom/server'],
		},
		ssr: {
			external: reactConfig.externals,
			noExternal: [
				// These are all needed to get mui to work.
				'@mui/material',
				'@mui/base',
				'@babel/runtime',
				'use-immer',
				'@material-tailwind/react',
			],
		},
	};
}

export default function ({
	include,
	exclude,
	babel,
	experimentalReactChildren,
}: ReactIntegrationOptions = {}): AstroIntegration {
	const majorVersion = getReactMajorVersion();
	if (isUnsupportedVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	const versionConfig = versionsConfig[majorVersion as SupportedReactVersion];

	return {
		name: '@astrojs/react',
		hooks: {
			'astro:config:setup': ({ command, addRenderer, updateConfig, injectScript }) => {
				addRenderer(getRenderer(versionConfig));
				updateConfig({
					vite: getViteConfiguration(
						{ include, exclude, babel, experimentalReactChildren },
						versionConfig
					),
				});
				if (command === 'dev') {
					const preamble = FAST_REFRESH_PREAMBLE.replace(`__BASE__`, '/');
					injectScript('before-hydration', preamble);
				}
			},
		},
	};
}
