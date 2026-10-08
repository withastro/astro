import type { Plugin as VitePlugin } from 'vite';
import { VIRTUAL_SERVICE_ID } from '../../../assets/consts.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';

export const PRERENDER_IMAGE_SERVICE_CHUNK_NAME = 'prerender-image-service';

/**
 * Emits the build image service as its own prerender chunk when Astro's default prerenderer runs
 * the prerender bundle in Node, so images can be generated without loading the whole bundle.
 */
export function pluginImageService(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin {
	let referenceId: string | undefined;
	return {
		name: 'astro:build:image-service',

		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender;
		},

		buildStart() {
			referenceId = undefined;
			if (options.settings.prerenderer) return;
			referenceId = this.emitFile({
				type: 'chunk',
				id: VIRTUAL_SERVICE_ID,
				name: PRERENDER_IMAGE_SERVICE_CHUNK_NAME,
				preserveSignature: 'strict',
			});
		},

		generateBundle() {
			if (referenceId) {
				internals.prerenderImageServiceFileName = this.getFileName(referenceId);
			}
		},
	};
}
