import type { Plugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { patchOverlay } from '../core/errors/overlay.js';

export function vitePluginAstroServerClient(): Plugin {
	return {
		name: 'astro:server-client',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
		},
		transform(code, id) {
			if (!id.includes('vite/dist/client/client.mjs')) return;

			// Replace the Vite overlay with ours
			return patchOverlay(code);
		},
	};
}
