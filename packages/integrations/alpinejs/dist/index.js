import { resolve } from 'node:path';
function virtualEntrypoint(options) {
	const virtualModuleId = 'virtual:@astrojs/alpinejs/entrypoint';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;
	let isBuild;
	let root;
	let entrypoint;
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
		resolveId: {
			filter: {
				id: new RegExp(`^${virtualModuleId}$`),
			},
			handler() {
				return resolvedVirtualModuleId;
			},
		},
		load: {
			filter: {
				id: new RegExp(`^${resolvedVirtualModuleId}$`),
			},
			handler() {
				if (entrypoint) {
					return `import * as mod from ${JSON.stringify(entrypoint)};
						
export const setup = (Alpine) => {
	if ('default' in mod) {
		mod.default(Alpine);
	} else {
		${
			!isBuild
				? `console.warn("[@astrojs/alpinejs] entrypoint \`" + ${JSON.stringify(
						entrypoint,
					)} + "\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/alpinejs/#entrypoint.");`
				: ''
		}
	}
}`;
				}
				return `export const setup = () => {};`;
			},
		},
	};
}
function createPlugin(options) {
	return {
		name: '@astrojs/alpinejs',
		hooks: {
			'astro:config:setup': ({ injectScript, updateConfig }) => {
				injectScript(
					'page',
					`import Alpine from 'alpinejs';
import { setup } from 'virtual:@astrojs/alpinejs/entrypoint';
setup(Alpine);
window.Alpine = Alpine;
document.addEventListener('DOMContentLoaded', () => Alpine.start());`,
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
export { createPlugin as default };
