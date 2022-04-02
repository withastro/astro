import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import path from 'path';
import tailwindPlugin from 'tailwindcss';
import type { TailwindConfig } from 'tailwindcss/tailwind-config';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import autoprefixerPlugin from 'autoprefixer';
import load from '@proload/core';

function getDefaultTailwindConfig(srcUrl: URL): TailwindConfig {
	return resolveConfig({
		theme: {
			extend: {},
		},
		plugins: [],
		content: [path.join(fileURLToPath(srcUrl), `**`, `*.{astro,html,js,jsx,svelte,ts,tsx,vue}`)],
	});
}

async function getUserConfig(root: URL, configPath?: string) {
	const resolvedRoot = fileURLToPath(root);
	let userConfigPath: string | undefined;

	if (configPath) {
		const configPathWithLeadingSlash = /^\.*\//.test(configPath) ? configPath : `./${configPath}`;
		userConfigPath = fileURLToPath(new URL(configPathWithLeadingSlash, root));
	}

	return await load('tailwind', { mustExist: false, cwd: resolvedRoot, filePath: userConfigPath });
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

export default function tailwindIntegration(options: TailwindOptions): AstroIntegration {
	const applyAstroConfigPreset = options?.config?.applyAstroPreset ?? true;
	const applyBaseStyles = options?.config?.applyBaseStyles ?? true;
	const customConfigPath = options?.config?.path;
	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, injectScript }) => {
				// Inject the Tailwind postcss plugin
				const userConfig = await getUserConfig(config.root, customConfigPath);

				if (customConfigPath && !userConfig?.value) {
					throw new Error(
						`Could not find a Tailwind config at ${JSON.stringify(
							customConfigPath
						)}. Does the file exist?`
					);
				}

				const tailwindConfig: TailwindConfig =
					(userConfig?.value as TailwindConfig) ?? getDefaultTailwindConfig(config.srcDir);
				if (applyAstroConfigPreset && userConfig?.value) {
					// apply Astro config as a preset to user config
					// this avoids merging or applying nested spread operators ourselves
					tailwindConfig.presets = [
						getDefaultTailwindConfig(config.srcDir),
						...(tailwindConfig.presets || []),
					];
				}

				config.style.postcss.plugins.push(tailwindPlugin(tailwindConfig));
				config.style.postcss.plugins.push(autoprefixerPlugin);

				if (applyBaseStyles) {
					// Inject the Tailwind base import
					injectScript('page-ssr', `import '@astrojs/tailwind/base.css';`);
				}
			},
		},
	};
}
