import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import tailwindcss from '@tailwindcss/vite';

type TailwindOptions = {
	/**
	 * Path to your tailwind config file
	 * @deprecated It is recommended to use the `@config` directive, see https://tailwindcss.com/docs/upgrade-guide#using-a-javascript-config-file
	 * @default './tailwind.config.mjs'
	 */
	configFile?: string;
	/**
	 * Apply Tailwind's base styles
	 * @deprecated It is recommended to use a css file to configure Tailwind, see https://tailwindcss.com/docs/upgrade-guide#removed-tailwind-directives
	 * @default true
	 */
	applyBaseStyles?: boolean;
};

const VIRTUAL_MODULE_ID = 'virtual:@astrojs/tailwind/base.css';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

function baseStylesPlugin(configFile?: string): Plugin {
	let content = '@import "tailwindcss";';
	if (configFile) {
		content += `@config ${JSON.stringify(configFile)};`;
	}

	return {
		name: '@astrojs/tailwind/virtual-css',
		resolveId(id) {
			if (id === VIRTUAL_MODULE_ID) {
				return RESOLVED_VIRTUAL_MODULE_ID;
			}
		},
		load(id, opts) {
			if (id === RESOLVED_VIRTUAL_MODULE_ID && opts?.ssr) {
				return content;
			}
		},
	};
}

export default function tailwindIntegration({
	applyBaseStyles = true,
	configFile,
}: TailwindOptions): AstroIntegration {
	if (applyBaseStyles && !configFile) {
		configFile = './tailwind.config.mjs';
	}

	return {
		name: '@astrojs/tailwind',
		hooks: {
			'astro:config:setup': async ({ config, updateConfig, injectScript, logger }) => {
				updateConfig({
					vite: {
						plugins: [tailwindcss()],
					},
				});

				if (applyBaseStyles) {
					logger.warn('Deprecated');
					updateConfig({
						vite: {
							plugins: [
								baseStylesPlugin(
									configFile ? fileURLToPath(new URL(configFile, config.root)) : undefined,
								),
							],
						},
					});
					injectScript('page-ssr', `import ${JSON.stringify(VIRTUAL_MODULE_ID)};`);
				}
			},
		},
	};
}
