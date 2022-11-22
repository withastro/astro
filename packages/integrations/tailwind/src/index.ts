import load, { resolve } from '@proload/core';
import type { AstroIntegration } from 'astro';
import autoprefixerPlugin from 'autoprefixer';
import fs from 'fs/promises';
import path from 'path';
import tailwindPlugin, { Config as TailwindConfig } from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig.js';
import { fileURLToPath } from 'url';

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

async function getUserConfig(root: URL, configPath?: string, isRestart = false) {
	const resolvedRoot = fileURLToPath(root);
	let userConfigPath: string | undefined;

	if (configPath) {
		const configPathWithLeadingSlash = /^\.*\//.test(configPath) ? configPath : `./${configPath}`;
		userConfigPath = fileURLToPath(new URL(configPathWithLeadingSlash, root));
	}

	if (isRestart) {
		// Hack: Write config to temporary file at project root
		// This invalidates and reloads file contents when using ESM imports or "resolve"
		const resolvedConfigPath = (await resolve('tailwind', {
			mustExist: false,
			cwd: resolvedRoot,
			filePath: userConfigPath,
		})) as string;

		const { dir, base } = path.parse(resolvedConfigPath);
		const tempConfigPath = path.join(dir, `.temp.${Date.now()}.${base}`);
		await fs.copyFile(resolvedConfigPath, tempConfigPath);

		let result: load.Config<Record<any, any>> | undefined;
		try {
			result = await load('tailwind', {
				mustExist: false,
				cwd: resolvedRoot,
				filePath: tempConfigPath,
			});
		} catch (err) {
			console.error(err);
		} finally {
			await fs.unlink(tempConfigPath);
		}

		return {
			...result,
			filePath: resolvedConfigPath,
		};
	} else {
		return await load('tailwind', {
			mustExist: false,
			cwd: resolvedRoot,
			filePath: userConfigPath,
		});
	}
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
			'astro:config:setup': async ({ config, injectScript, addWatchFile, isRestart }) => {
				// Inject the Tailwind postcss plugin
				const userConfig = await getUserConfig(config.root, customConfigPath, isRestart);

				if (customConfigPath && !userConfig?.value) {
					throw new Error(
						`Could not find a Tailwind config at ${JSON.stringify(
							customConfigPath
						)}. Does the file exist?`
					);
				}

				if (addWatchFile && userConfig?.filePath) {
					addWatchFile(userConfig.filePath);
				}

				const tailwindConfig: TailwindConfig =
					(userConfig?.value as TailwindConfig) ?? getDefaultTailwindConfig(config.srcDir);
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
