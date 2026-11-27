import type { Plugin as VitePlugin } from 'vite';
import {
	MIDDLEWARE_MODULE_ID,
	MIDDLEWARE_RESOLVED_MODULE_ID,
} from '../../../internal/core/middleware/vite-plugin.js';
import { addRolldownInput } from '../add-rolldown-input.js';
import { pathToDirectoryURL } from '../../../internal/core/build/common.js';
import type { BuildInternals } from '../../../internal/core/build/internal.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../../internal/core/constants.js';

export function pluginMiddleware(internals: BuildInternals): VitePlugin {
	let canSplitMiddleware = true;
	return {
		name: '@astro/plugin-middleware-build',
		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr;
		},

		configResolved(config) {
			// Cloudflare Workers (webworker target) can't have multiple entrypoints,
			// so we only add middleware as a separate bundle for other targets (Node, Deno, etc).
			canSplitMiddleware = config.ssr.target !== 'webworker';
		},

		options(options) {
			if (canSplitMiddleware) {
				// Add middleware as a separate rolldown input for environments that support multiple entrypoints.
				// This allows the middleware to be bundled independently.
				return addRolldownInput(options, [MIDDLEWARE_MODULE_ID]);
			} else {
				// TODO warn if edge middleware is enabled
			}
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'asset' && chunk.facadeModuleId === MIDDLEWARE_RESOLVED_MODULE_ID) {
					const outputDirectory = pathToDirectoryURL(this.environment.config.build.outDir);
					internals.middlewareEntryPoint = new URL(chunkName, outputDirectory);
				}
			}
		},
	};
}
