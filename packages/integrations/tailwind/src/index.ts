import type { AstroIntegration } from 'astro';
import autoprefixerPlugin from 'autoprefixer';
import clearModule from 'clear-module';
import { existsSync } from 'fs';
import path from 'path';
import tailwindPlugin, { type Config as TailwindConfig } from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import { fileURLToPath } from 'url';
import type { CSSOptions, UserConfig } from 'vite';

function getDefaultTailwindConfig(srcUrl: URL): TailwindConfig {
	return resolveConfig({
		theme: {
			extend: {},
		},
		plugins: [],
		content: [path.join(fileURLToPath(srcUrl), `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)],
		presets: undefined, // enable Tailwind's default preset
	}) as TailwindConfig;
}

async function getUserConfig(
	root: URL,
	configPath?: string,
	isRestart = false
): Promise<{ config: TailwindConfig | undefined; configPath: string }> {
	const resolvedRoot = fileURLToPath(root);
	let userConfigPath: string | undefined;

	if (configPath) {
		const configPathWithLeadingSlash = /^\.*\//.test(configPath) ? configPath : `./${configPath}`;
		userConfigPath = fileURLToPath(new URL(configPathWithLeadingSlash, root));
	}

	let resolvedConfigPath = '';
	if (!configPath) {
		if (path.join(resolvedRoot, 'tailwind.config.js')) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.ts');
		} else if (existsSync(path.join(resolvedRoot + 'tailwind.config.ts'))) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.ts');
		} else if (existsSync(path.join(resolvedRoot + 'tailwind.config.cjs'))) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.cjs');
		} else if (existsSync(path.join(resolvedRoot + 'tailwind.config.mjs'))) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.mjs');
		} else {
			throw new Error('No tailwind config found at project root');
		}
	}

	const configPathToUse = userConfigPath ?? resolvedConfigPath;

	if (!loadConfig && configPathToUse.endsWith('ts')) {
		throw new Error(
			'To use a typescript tailwind config file please install tailwind 3.3.0 or higher'
		);
	}

	// previous to tailwindcss 3.3.0 loadConfig did not exist

	if (isRestart) {
		clearModule(configPathToUse);
		if (configPathToUse.endsWith('ts')) {
			return { config: loadConfig(configPathToUse), configPath: configPathToUse };
		} else {
			return { config: (await import(configPathToUse))?.default, configPath: configPathToUse };
		}
	} else {
		try {
			if (configPathToUse.endsWith('ts')) {
				return { config: loadConfig(configPathToUse), configPath: configPathToUse };
			} else {
				return { config: (await import(configPathToUse)).default, configPath: configPathToUse };
			}
		} catch (err) {
			console.error('failed to load tailwind config: ', err);
			return { config: undefined, configPath: configPathToUse };
		}
	}
}

async function getPostCssConfig(
	root: UserConfig['root'],
	postcssInlineOptions: CSSOptions['postcss']
) {
	let postcssConfigResult;
	// Check if postcss config is not inlined
	if (!(typeof postcssInlineOptions === 'object' && postcssInlineOptions !== null)) {
		let { default: postcssrc } = await import('postcss-load-config');
		const searchPath = typeof postcssInlineOptions === 'string' ? postcssInlineOptions : root!;
		try {
			postcssConfigResult = await postcssrc({}, searchPath);
		} catch (e) {
			postcssConfigResult = null;
		}
	}
	return postcssConfigResult;
}

async function getViteConfiguration(tailwindConfig: TailwindConfig, viteConfig: UserConfig) {
	// We need to manually load postcss config files because when inlining the tailwind and autoprefixer plugins,
	// that causes vite to ignore postcss config files
	const postcssConfigResult = await getPostCssConfig(viteConfig.root, viteConfig.css?.postcss);

	const postcssOptions = (postcssConfigResult && postcssConfigResult.options) || {};

	const postcssPlugins =
		postcssConfigResult && postcssConfigResult.plugins ? postcssConfigResult.plugins.slice() : [];
	postcssPlugins.push(tailwindPlugin(tailwindConfig));

	postcssPlugins.push(autoprefixerPlugin());
	return {
		css: {
			postcss: {
				options: postcssOptions,
				plugins: postcssPlugins,
			},
		},
	};
}

type TailwindOptions =
	| {
			config?: {
				/**
				 * Path to your tailwind config file
				 * @default 'tailwind.config.js'
				 */
				path?: string;
				/**
				 * Apply Tailwind's base styles
				 * Disabling this is useful when further customization of Tailwind styles
				 * and directives is required. See {@link https://tailwindcss.com/docs/functions-and-directives#tailwind Tailwind's docs}
				 * for more details on directives and customization.
				 * @default: true
				 */
				applyBaseStyles?: boolean;
			};
	  }
	| undefined;

export default function tailwindIntegration(options?: TailwindOptions): AstroIntegration {
	const applyBaseStyles = options?.config?.applyBaseStyles ?? true;
	const customConfigPath = options?.config?.path;
	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({
				config,
				updateConfig,
				injectScript,
				addWatchFile,
				isRestart,
			}) => {
				// Inject the Tailwind postcss plugin
				const userConfig = await getUserConfig(config.root, customConfigPath, isRestart);

				if (customConfigPath && !userConfig) {
					throw new Error(
						`Could not find a Tailwind config at ${JSON.stringify(
							customConfigPath
						)}. Does the file exist?`
					);
				}

				if (addWatchFile && userConfig?.configPath && !isRestart) {
					addWatchFile(userConfig.configPath);
				}

				const tailwindConfig = userConfig.config ?? getDefaultTailwindConfig(config.root);

				updateConfig({
					vite: await getViteConfiguration(tailwindConfig, config.vite),
				});

				if (applyBaseStyles) {
					// Inject the Tailwind base import
					injectScript('page-ssr', `import '@astrojs/tailwind/base.css';`);
				}
			},
		},
	};
}
