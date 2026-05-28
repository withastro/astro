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
 *
 * This runs in `generateBundle` (not `renderChunk`) so that Vite's CSS plugin
 * can first remove pure-CSS wrapper chunks and replace their imports with
 * `/* empty css * /` comments. If we rewrote imports earlier (in `renderChunk`),
 * the appended query params would break Vite's regex-based CSS chunk cleanup,
 * leaving dangling imports to deleted chunks that 404 at runtime.
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

		async generateBundle(_options, bundle) {
			await init;

			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'chunk') continue;
				if (!chunk.code.includes('./')) continue;

				const [imports] = parse(chunk.code);

				// Filter to relative JS imports only
				const relativeImports = imports.filter(
					(imp) => imp.n && /^\.\.?\//.test(imp.n) && /\.(?:js|mjs)$/.test(imp.n),
				);

				if (relativeImports.length === 0) continue;

				// Build new code by replacing specifiers from end to start
				// (reverse order preserves earlier offsets)
				let rewritten = chunk.code;
				for (let i = relativeImports.length - 1; i >= 0; i--) {
					const imp = relativeImports[i];
					// imp.s and imp.e are the start/end offsets of the module specifier.
					// Static imports: e points after the specifier text, before the quote.
					// Dynamic string imports: e points after the closing quote.
					const insertAt = imp.d > -1 ? imp.e - 1 : imp.e;
					rewritten = rewritten.slice(0, insertAt) + '?' + queryString + rewritten.slice(insertAt);
				}

				chunk.code = rewritten;
			}
		},
	};
}
