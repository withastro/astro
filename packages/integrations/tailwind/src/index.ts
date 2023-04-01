import load, { resolve } from '@proload/core';
import typescript from '@proload/plugin-typescript';

import type { AstroIntegration } from 'astro';
import autoprefixerPlugin from 'autoprefixer';
import path from 'path';
import tailwindPlugin, { type Config as TailwindConfig } from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import { fileURLToPath } from 'url';
import type { CSSOptions, UserConfig } from 'vite';

function getDefaultTailwindConfig(srcUrl: URL): TailwindConfig {
	return resolveConfig({
		content: [path.join(fileURLToPath(srcUrl), `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)],
	}) as TailwindConfig;
}

async function getUserConfig(root: URL, srcDir: URL, configPath?: string) {
	const resolvedRoot = fileURLToPath(root);
	let userConfigPath: string | undefined;

	if (configPath) {
		const configPathWithLeadingSlash = /^\.*\//.test(configPath) ? configPath : `./${configPath}`;
		userConfigPath = fileURLToPath(new URL(configPathWithLeadingSlash, root));
	}

	load.use([typescript]);

	try {
		const resolvedConfigPath = await resolve('tailwind', {
			mustExist: true,
			cwd: resolvedRoot,
			filePath: userConfigPath,
		});
		return { config: resolvedConfigPath as string };
	} catch (err) {
		if (configPath) {
			console.error(
				`Could not find a Tailwind config at ${JSON.stringify(configPath)}. Does the file exist?`
			);
		}
		return getDefaultTailwindConfig(srcDir);
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

async function getViteConfiguration(
	tailwindConfig: TailwindConfig | { config: string },
	viteConfig: UserConfig
) {
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
			'astro:config:setup': async ({ config, updateConfig, injectScript }) => {
				const userConfig = await getUserConfig(config.root, config.srcDir, customConfigPath);

				// Inject the Tailwind postcss plugin
				updateConfig({
					vite: await getViteConfiguration(userConfig, config.vite as UserConfig),
				});

				if (applyBaseStyles) {
					// Inject the Tailwind base import
					injectScript('page-ssr', `import '@astrojs/tailwind/base.css';`);
				}
			},
		},
	};
}
