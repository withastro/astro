import type { AstroConfig } from '../@types/astro';
import * as vite from 'vite';
import { AstroError } from '../core/errors/index.js';

const virtualModuleId = 'astro:transitions';
const resolvedVirtualModuleId = '\0' + virtualModuleId;

// The virtual module for the astro:transitions namespace
export default function astroTransitions({ config }: { config: AstroConfig; }): vite.Plugin {
	return {
		name: 'astro:transitions',
		async resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id) {
			if (id === resolvedVirtualModuleId) {
				if(!config.experimental.viewTransitions) {
					throw new AstroError({
						title: 'Experimental View Transitions not enabled',
						message: `View Transitions support is experimental. To enable update your config to include: 
						
export default defineConfig({
	experimental: {
		viewTransitions: true
	}
})`
					});
				}

				return `
				export * from "astro/transitions";
				export { default as ViewTransitions } from "astro/components/ViewTransitions.astro";
			`;
			}
		},
	};
}
