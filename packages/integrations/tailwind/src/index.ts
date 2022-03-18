import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import path from 'path';
import tailwindPlugin from 'tailwindcss';
import type { TailwindConfig } from 'tailwindcss/tailwind-config';
import autoprefixerPlugin from 'autoprefixer';
import fs from 'fs';

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
			config: {
				/**
				 * Path to your tailwind config file
				 * @default 'tailwind.config.js'
				 */
				path: string;
				/**
				 * Apply Astro's default Tailwind config as a preset to your config
				 * This is recommended to enable Tailwind across all components and Astro files
				 * @default true
				 */
				mergeWithDefaults: boolean;
			};
	  }
	| undefined;

export default function (integrationConfig: IntegrationConfig): AstroIntegration {
	const configPath = path.resolve(integrationConfig?.config?.path ?? 'tailwind.config.js');
	const mergeConfigWithDefaults = integrationConfig?.config?.mergeWithDefaults ?? true;
	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, injectScript }) => {
				// Inject the Tailwind postcss plugin
				const customConfig = fs.existsSync(configPath) ? (await import(configPath)).default : undefined;
				let tailwindConfig: TailwindConfig;
				if (typeof customConfig === 'object' && customConfig !== null) {
					if (mergeConfigWithDefaults) {
						tailwindConfig = {
							presets: [getDefaultTailwindConfig(config.src), ...(customConfig.presets || [])],
							...customConfig,
						};
					} else {
						tailwindConfig = customConfig;
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
