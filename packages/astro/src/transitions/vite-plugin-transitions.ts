import * as vite from 'vite';

const virtualModuleId = 'astro:transitions';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const routerVirtualModuleId = 'astro:transitions/router';
const routerResolvedVirtualModuleId = '\0' + routerVirtualModuleId;

// The virtual module for the astro:transitions namespace
export default function astroTransitions(): vite.Plugin {
	return {
		name: 'astro:transitions',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			if (id === routerVirtualModuleId) {
				return routerResolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
				export * from "astro/transitions";
				export { default as ViewTransitions } from "astro/components/ViewTransitions.astro";
			`;
			}
			if (id === routerResolvedVirtualModuleId) {
				return `
				export * from "astro/transitions/router";
			`;
			}
		},
	};
}
