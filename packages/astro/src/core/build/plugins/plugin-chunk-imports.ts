import { init, parse } from 'es-module-lexer';
import type { Plugin as VitePlugin } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import type { StaticBuildOptions } from '../types.js';

/**
 * Appends assetQueryParams (e.g., ?dpl=<VERCEL_DEPLOYMENT_ID>) to relative
 * JS import paths inside client chunks. Without this, inter-chunk imports
 * bypass the HTML rendering pipeline and miss skew protection query params.
 *
 * Uses es-module-lexer to reliably parse both static and dynamic imports.
 */
export function pluginChunkImports(options: StaticBuildOptions): VitePlugin | undefined {
	const assetQueryParams = options.settings.adapter?.client?.assetQueryParams;
	if (!assetQueryParams || assetQueryParams.toString() === '') {
		return undefined;
	}
	const queryString = assetQueryParams.toString();

	return {
		name: '@astro/plugin-chunk-imports',
		enforce: 'post',

		applyToEnvironment(environment) {
			return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
		},

		async renderChunk(code, _chunk) {
			if (!code.includes('./')) {
				return null;
			}

			await init;
			const [imports] = parse(code);

			// Filter to relative JS imports only
			const relativeImports = imports.filter(
				(imp) => imp.n && /^\.\.?\//.test(imp.n) && /\.(?:js|mjs)$/.test(imp.n),
			);

			if (relativeImports.length === 0) {
				return null;
			}

			// Build new code by replacing specifiers from end to start
			// (reverse order preserves earlier offsets)
			let rewritten = code;
			for (let i = relativeImports.length - 1; i >= 0; i--) {
				const imp = relativeImports[i];
				// imp.s and imp.e are the start/end offsets of the module specifier (without quotes)
				rewritten = rewritten.slice(0, imp.e) + '?' + queryString + rewritten.slice(imp.e);
			}

			return { code: rewritten, map: null };
		},
	};
}
