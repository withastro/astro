import type * as unifont from 'unifont';
import type { LocalFontFamily } from '../types.js';
import { DEFAULTS } from '../constants.js';
import { fileURLToPath } from 'node:url';
import { extractFontType, type URLProxy } from '../utils.js';

// https://fonts.nuxt.com/get-started/providers#local
// https://github.com/nuxt/fonts/blob/main/src/providers/local.ts
// https://github.com/unjs/unifont/blob/main/src/providers/google.ts

export const LOCAL_PROVIDER_NAME = 'local';

type InitializedProvider = NonNullable<Awaited<ReturnType<unifont.Provider>>>;

type ResolveFontResult = NonNullable<Awaited<ReturnType<InitializedProvider['resolveFont']>>>;

interface ResolveOptions {
	root: URL;
	proxyURL: URLProxy;
}

// TODO: dev watcher and ways to update during dev
// change: update hashToUrlMap
// unlink: throw error
export function resolveLocalFont(
	family: LocalFontFamily,
	{ proxyURL, root }: ResolveOptions,
): ResolveFontResult {
	const fonts: ResolveFontResult['fonts'] = [];

	for (const src of family.src) {
		for (const weight of src.weights ?? DEFAULTS.weights) {
			for (const style of src.styles ?? DEFAULTS.styles) {
				// TODO: handle fallbacks?
				// TODO: handle subset
				fonts.push({
					weight,
					style,
					src: src.paths.map((path) => ({
						// TODO: check files exist or throw
						url: proxyURL(fileURLToPath(new URL(path, root))),
						format: extractFontType(path),
					})),
				});
			}
		}
	}

	return {
		fonts,
	};
}
