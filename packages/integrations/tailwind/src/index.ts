import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import path from 'path';
import tailwindPlugin from 'tailwindcss';
import type { TailwindConfig } from 'tailwindcss/tailwind-config';
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

type IntegrationConfig =
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

export default function (integrationConfig: IntegrationConfig): AstroIntegration {
	const applyAstroConfigPreset = integrationConfig?.config?.applyAstroPreset ?? true;
	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, injectScript }) => {
				// Inject the Tailwind postcss plugin
				const projectRoot = fileURLToPath(config.projectRoot);
				let userConfigPath: string | undefined;
				if (integrationConfig?.config?.path) {
					const configPath = integrationConfig?.config?.path;
					const configPathWithLeadingSlash = /^\.*\//.test(configPath) ? configPath : `./${configPath}`;
					userConfigPath = fileURLToPath(new URL(configPathWithLeadingSlash, `file://${projectRoot}/`));
				}
				const customConfig = await load('tailwind', { mustExist: false, cwd: projectRoot, filePath: userConfigPath });

				let tailwindConfig: TailwindConfig;
				if (typeof customConfig?.value === 'object' && customConfig.value !== null) {
					if (applyAstroConfigPreset) {
						tailwindConfig = {
							presets: [getDefaultTailwindConfig(config.src), ...(customConfig.value.presets || [])],
							...(customConfig.value as TailwindConfig),
						};
					} else {
						tailwindConfig = customConfig.value as TailwindConfig;
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
