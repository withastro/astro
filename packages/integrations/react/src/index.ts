import react, { type Options as ViteReactPluginOptions } from '@vitejs/plugin-react';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type * as vite from 'vite';
import {
	getReactMajorVersion,
	isSupportedReactVersion,
	type ReactVersionConfig,
	versionsConfig,
} from './version.js';

export type ReactIntegrationOptions = Pick<
	ViteReactPluginOptions,
	'include' | 'exclude' | 'babel'
> & {
	experimentalReactChildren?: boolean;
	experimentalDisableStreaming?: boolean;
};

const INTEGRATION_NAME = '@astrojs/react';
const VIRTUAL_MODULE_ID = 'astro:react:opts';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
const FAST_REFRESH_PREAMBLE = react.preambleCode;
const KNOWN_JSX_RENDERERS = ['@astrojs/react', '@astrojs/preact', '@astrojs/solid-js'];
const SSR_NO_EXTERNAL_PACKAGES = [
	'@mui/material',
	'@mui/base',
	'@babel/runtime',
	'use-immer',
	'@material-tailwind/react',
];

function validateReactVersion() {
	const majorVersion = getReactMajorVersion();
	if (!isSupportedReactVersion(majorVersion)) {
		throw new Error(`Unsupported React version: ${majorVersion}.`);
	}
	return versionsConfig[majorVersion];
}

function createRenderer(reactConfig: ReactVersionConfig): AstroRenderer {
	return {
		name: INTEGRATION_NAME,
		clientEntrypoint: reactConfig.client,
		serverEntrypoint: reactConfig.server,
	};
}

interface OptionsPluginParams {
	experimentalReactChildren: boolean;
	experimentalDisableStreaming: boolean;
}

function createVirtualModuleCode(options: OptionsPluginParams): string {
	return `export default {
		experimentalReactChildren: ${JSON.stringify(options.experimentalReactChildren)},
		experimentalDisableStreaming: ${JSON.stringify(options.experimentalDisableStreaming)}
	}`;
}

function createOptionsPlugin(options: OptionsPluginParams): vite.Plugin {
	return {
		name: `${INTEGRATION_NAME}:opts`,
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID) {
				return { code: createVirtualModuleCode(options) };
			}
		},
	};
}

function createViteConfiguration(
	options: ReactIntegrationOptions,
	reactConfig: ReactVersionConfig,
) {
	const {
		include,
		exclude,
		babel,
		experimentalReactChildren = false,
		experimentalDisableStreaming = false,
	} = options;

	return {
		optimizeDeps: {
			include: [reactConfig.client],
			exclude: [reactConfig.server],
		},
		plugins: [
			react({ include, exclude, babel }),
			createOptionsPlugin({
				experimentalReactChildren: !!experimentalReactChildren,
				experimentalDisableStreaming: !!experimentalDisableStreaming,
			}),
		],
		ssr: {
			noExternal: SSR_NO_EXTERNAL_PACKAGES,
		},
	};
}

function setupConfigHook(
	options: ReactIntegrationOptions,
	versionConfig: ReactVersionConfig,
	{ command, addRenderer, updateConfig, injectScript }: any,
) {
	addRenderer(createRenderer(versionConfig));
	updateConfig({
		vite: createViteConfiguration(options, versionConfig),
	});

	if (command === 'dev') {
		const preamble = FAST_REFRESH_PREAMBLE.replace('__BASE__', '/');
		injectScript('before-hydration', preamble);
	}
}

function configDoneHook(
	options: ReactIntegrationOptions,
	{ logger, config }: any,
) {
	const { include, exclude } = options;
	const enabledJsxRenderers = config.integrations.filter((integration: any) =>
		KNOWN_JSX_RENDERERS.includes(integration.name),
	);

	if (enabledJsxRenderers.length > 1 && !include && !exclude) {
		logger.warn(
			'More than one JSX renderer is enabled. This will lead to unexpected behavior unless you set the `include` or `exclude` option. See https://docs.astro.build/en/guides/integrations-guide/react/#combining-multiple-jsx-frameworks for more information.',
		);
	}
}

export default function (options: ReactIntegrationOptions = {}): AstroIntegration {
	const versionConfig = validateReactVersion();

	return {
		name: INTEGRATION_NAME,
		hooks: {
			'astro:config:setup': (params) => setupConfigHook(options, versionConfig, params),
			'astro:config:done': (params) => configDoneHook(options, params),
		},
	};
}

export function getContainerRenderer(): AstroRenderer {
	return createRenderer(validateReactVersion());
}
