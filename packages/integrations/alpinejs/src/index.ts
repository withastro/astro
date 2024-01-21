import type { AstroIntegration } from 'astro';
import type { Plugin } from 'vite';
import { resolve } from 'node:path';

interface Options {
	entrypoint?: string;
}

function virtualEntrypoint(options?: Options): Plugin {
	const virtualModuleId = 'virtual:@astrojs/alpinejs/entrypoint';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	let isBuild: boolean;
	let root: string;
	let entrypoint: string | undefined;

	return {
		name: '@astrojs/alpinejs/virtual-entrypoint',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		configResolved(config) {
			root = config.root;
			if (options?.entrypoint) {
				entrypoint = options.entrypoint.startsWith('.')
					? resolve(root, options.entrypoint)
					: options.entrypoint;
			}
		},
		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				if (entrypoint) {
					return `\
import * as mod from ${JSON.stringify(entrypoint)};
						
export const setup = (Alpine) => {
	if ('default' in mod) {
		mod.default(Alpine);
	} else {
		${
			!isBuild
				? `console.warn("[@astrojs/alpinejs] entrypoint \`" + ${JSON.stringify(
						entrypoint
					)} + "\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/alpinejs/#entrypoint.");`
				: ''
		}
	}
}`;
				}
				return `export const setup = () => {};`;
			}
		},
	};
}

export default function createPlugin(options?: Options): AstroIntegration {
	return {
		name: '@astrojs/alpinejs',
		hooks: {
			'astro:config:setup': ({ injectScript, updateConfig }) => {
				// This gets injected into the user's page, so the import will pull
				// from the project's version of Alpine.js in their package.json.
				injectScript(
					'page',
					`import Alpine from 'alpinejs';
import { setup } from 'virtual:@astrojs/alpinejs/entrypoint';
setup(Alpine);
window.Alpine = Alpine;
Alpine.start();`
				);
				updateConfig({
					vite: {
						plugins: [virtualEntrypoint(options)],
					},
				});
			},
		},
	};
}
