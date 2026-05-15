import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { convertPathToPattern } from 'tinyglobby';
import { fileURLToPath } from 'node:url';
const ONLY_DEV_EXTERNAL = [
	// Imported by `@astrojs/prism` which exposes `<Prism/>` that is processed by Vite
	'prismjs/components/index.js',
	// Imported by `astro/assets` -> `packages/astro/src/core/logger/core.ts`
	'string-width',
];
const ALWAYS_NOEXTERNAL = [
	// This is only because Vite's native ESM doesn't resolve "exports" correctly.
	'astro',
	// Vite fails on nested `.astro` imports without bundling
	'astro/components',
	// Handle recommended nanostores. Only @nanostores/preact is required from our testing!
	// Full explanation and related bug report: https://github.com/withastro/astro/pull/3667
	'@nanostores/preact',
	// fontsource packages are CSS that need to be processed
	'@fontsource/*',
];
function vitePluginEnvironment({ command, settings, astroPkgsConfig }) {
	const srcDirPattern = convertPathToPattern(fileURLToPath(settings.config.srcDir));
	return {
		name: 'astro:environment',
		configEnvironment(environmentName, _options) {
			const finalEnvironmentOptions = {
				optimizeDeps: {
					include: [],
					exclude: [],
				},
				resolve: {
					// Astro imports in third-party packages should use the same version as root
					dedupe: ['astro'],
				},
			};
			if (
				environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
				environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.client
			) {
				if (_options.resolve?.noExternal !== true) {
					finalEnvironmentOptions.resolve.noExternal = [
						...ALWAYS_NOEXTERNAL,
						...astroPkgsConfig.ssr.noExternal,
					];
					finalEnvironmentOptions.resolve.external = [
						...(command === 'dev' ? ONLY_DEV_EXTERNAL : []),
						...astroPkgsConfig.ssr.external,
					];
				}
				if (_options.optimizeDeps?.noDiscovery === false) {
					finalEnvironmentOptions.optimizeDeps = {
						entries: [`${srcDirPattern}**/*.{jsx,tsx,vue,svelte,html,astro}`],
						include: [],
						exclude: ['node-fetch'],
					};
				}
			}
			if (environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.client) {
				finalEnvironmentOptions.optimizeDeps = {
					include: [
						// For the dev toolbar
						'astro > html-escaper',
						'astro/runtime/client/dev-toolbar/entrypoint.js',
					],
					exclude: ['astro:*', 'virtual:astro:*', 'astro/virtual-modules/prefetch.js'],
					// Astro files can't be rendered on the client
					entries: [`${srcDirPattern}**/*.{jsx,tsx,vue,svelte,html}`],
				};
			}
			return finalEnvironmentOptions;
		},
	};
}
export { vitePluginEnvironment };
