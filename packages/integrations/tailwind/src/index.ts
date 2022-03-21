import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import path from 'path';
import tailwindPlugin from 'tailwindcss';
import type { TailwindConfig } from 'tailwindcss/tailwind-config';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import autoprefixerPlugin from 'autoprefixer';
import load from '@proload/core';

function getDefaultTailwindConfig(srcUrl: URL): TailwindConfig {
	return {
		theme: {
			extend: {},
		},
		plugins: [],
		content: [path.join(fileURLToPath(srcUrl), `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)],
	};
}

async function getUserConfig(projectRoot: URL, configPath?: string) {
	const resolvedProjectRoot = fileURLToPath(projectRoot);
	let userConfigPath: string | undefined;

	if (configPath) {
		const configPathWithLeadingSlash = /^\.*\//.test(configPath) ? configPath : `./${configPath}`;
		userConfigPath = fileURLToPath(new URL(configPathWithLeadingSlash, `file://${resolvedProjectRoot}/`));
	}

	return await load('tailwind', { mustExist: false, cwd: resolvedProjectRoot, filePath: userConfigPath });
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
				 * Apply Astro's default Tailwind config as a preset
				 * This is recommended to enable Tailwind across all components and Astro files
				 * @default true
				 */
				applyAstroPreset?: boolean;
			};
	  }
	| undefined;

export default function (options: TailwindOptions): AstroIntegration {
	const applyAstroConfigPreset = options?.config?.applyAstroPreset ?? true;
	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, injectScript }) => {
				// Inject the Tailwind postcss plugin
				const userConfig = await getUserConfig(config.projectRoot, options?.config?.path);

				let tailwindConfig: TailwindConfig;
				if (typeof userConfig?.value === 'object' && userConfig.value !== null) {
					if (applyAstroConfigPreset) {
						tailwindConfig = {
							presets: [getDefaultTailwindConfig(config.src), ...(userConfig.value.presets || [])],
							...(userConfig.value as TailwindConfig),
						};
					} else {
						tailwindConfig = userConfig.value as TailwindConfig;
					}
				} else {
					tailwindConfig = getDefaultTailwindConfig(config.src);
				}
				config.styleOptions.postcss.plugins.push(tailwindPlugin(tailwindConfig));
				config.styleOptions.postcss.plugins.push(autoprefixerPlugin);

				// Inject the Tailwind base import
				injectScript('page-ssr', `import '@astrojs/tailwind/base.css';`);
			},
		},
	};
}
