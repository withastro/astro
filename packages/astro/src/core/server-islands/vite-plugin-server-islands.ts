import type { AstroSettings } from '../../@types/astro.js';
import type { Plugin as VitePlugin } from 'vite';

const virtualModuleId = 'astro:internal/server-islands';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

export function vitePluginServerIslands({ settings }: { settings: AstroSettings }): VitePlugin {
	return {
		name: 'astro:server-islands',
		resolveId(source) {
			if(source === 'astro:internal/server-islands') {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if(id === resolvedVirtualModuleId) {
				return `
export let islands = null;

if(import.meta.env.DEV) {
	islands = new Proxy({}, {
		get(target, name) {
			return () => {
				console.log("IMPORT", name);
				return import(/* @vite-ignore */ name);
			};
		}
	});
} else {
	// TODO inline all of the known server islands from the build artifacts.
	islands = {};
}
`.trim();
			}
		}
	}
}
