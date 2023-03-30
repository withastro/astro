import type { AstroIntegration } from 'astro';
import autoprefixerPlugin from 'autoprefixer';
import { existsSync } from 'fs';
import { copyFile, unlink } from 'fs/promises';
import path from 'path';
import tailwindPlugin, { type Config as TailwindConfig } from 'tailwindcss';

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

	let resolvedConfigPath = path.join(resolvedRoot, 'tailwind.config.js');
	if (!configPath) {
		if (existsSync(path.join(resolvedRoot + 'tailwind.config.ts'))) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.ts');
		}

		if (existsSync(path.join(resolvedRoot + 'tailwind.config.cjs'))) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.cjs');
		}

		if (existsSync(path.join(resolvedRoot + 'tailwind.config.mjs'))) {
			resolvedConfigPath = path.join(resolvedRoot + 'tailwind.config.mjs');
		}
	}

	const configPathToUse = userConfigPath ?? resolvedConfigPath;
	let loadConfig: (filePath: string) => Promise<TailwindConfig>;

	try {
		const twLoad = (await import('tailwindcss/loadconfig.js')).default as (
			filePath: string
		) => TailwindConfig;
		loadConfig = async (filePath: string) => twLoad(filePath);
	} catch (e) {
		if (configPathToUse.endsWith('ts')) {
			throw new Error(
				'To use a typescript tailwind config file please install tailwind 3.3.0 or higher'
			);
		}

		// previous to tailwindcss 3.3.0 loadConfig did not exist
		const proLoad = (await import('@proload/core')).default;

		loadConfig = async (filePath: string) =>
			(
				await proLoad('tailwind', {
					mustExist: false,
					cwd: resolvedRoot,
					filePath,
				})
			)?.value as unknown as TailwindConfig;
	}

	if (isRestart) {
		// Hack: Write config to temporary file at project root
		// This invalidates and reloads file contents when using ESM imports or "resolve"
		const { dir, base } = path.parse(resolvedConfigPath);
		const tempConfigPath = path.join(dir, `.temp.${Date.now()}.${base}`);
		await copyFile(configPathToUse, tempConfigPath);

		let result: TailwindConfig | undefined;
		try {
			result = (await loadConfig(tempConfigPath)) as TailwindConfig;
		} catch (err) {
			console.error(err);
		} finally {
			await unlink(tempConfigPath);
		}

		return {
			config: result,
			configPath: configPathToUse,
		};
	} else {
		try {
			return {
				config: (await loadConfig(configPathToUse)) as TailwindConfig,
				configPath: configPathToUse,
			};
		} catch (err) {
			console.error(err);
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

				if (addWatchFile && userConfig?.configPath) {
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
