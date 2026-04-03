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
	// Snapshot adapter-provided params once so each rewrite reuses stable key/value pairs.
	const paramsToAppend = Array.from(assetQueryParams.entries());

	function appendQueryParams(specifier: string): string {
		const hashIndex = specifier.indexOf('#');
		const hash = hashIndex >= 0 ? specifier.slice(hashIndex) : '';
		const withoutHash = hashIndex >= 0 ? specifier.slice(0, hashIndex) : specifier;

		const queryIndex = withoutHash.indexOf('?');
		const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
		const existingQuery = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';

		const mergedQueryParams = new URLSearchParams(existingQuery);
		for (const [key, value] of paramsToAppend) {
			mergedQueryParams.append(key, value);
		}

		const mergedQueryString = mergedQueryParams.toString();
		return `${pathname}${mergedQueryString ? `?${mergedQueryString}` : ''}${hash}`;
	}

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
				const specifier = imp.n;
				if (!specifier) {
					continue;
				}

				// imp.s and imp.e are the start/end offsets of the full quoted specifier,
				// while imp.n is the unquoted specifier value.
				const quoteChar = rewritten[imp.s];
				if (quoteChar !== '"' && quoteChar !== "'") {
					continue;
				}

				const start = imp.s + 1;
				const end = imp.e - 1;
				rewritten = rewritten.slice(0, start) + appendQueryParams(specifier) + rewritten.slice(end);
			}

			return { code: rewritten, map: null };
		},
	};
}
