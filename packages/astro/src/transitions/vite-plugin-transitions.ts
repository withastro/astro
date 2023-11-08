import * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';

const virtualModuleId = 'astro:transitions';
const resolvedVirtualModuleId = '\0' + virtualModuleId;
const virtualClientModuleId = 'astro:transitions/client';
const resolvedVirtualClientModuleId = '\0' + virtualClientModuleId;

// The virtual module for the astro:transitions namespace
export default function astroTransitions({ settings }: { settings: AstroSettings }): vite.Plugin {
	return {
		name: 'astro:transitions',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
			if (id === virtualClientModuleId) {
				return resolvedVirtualClientModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				return `
				export * from "astro/transitions";
				export { default as ViewTransitions } from "astro/components/ViewTransitions.astro";
			`;
			}
			if (id === resolvedVirtualClientModuleId) {
				return `
				export * from "astro/transitions/router";
			`;
			}
		},
		transform(code, id) {
			if (id.includes('ViewTransitions.astro') && id.endsWith('.ts')) {
				const prefetchDisabled = settings.config.prefetch === false;
				return code.replace('__PREFETCH_DISABLED__', JSON.stringify(prefetchDisabled));
			}
		},
	};
}
