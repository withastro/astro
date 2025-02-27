import type * as unifont from 'unifont';
import type { LocalFontFamily } from '../types.js';
import { DEFAULTS } from '../constants.js';
import { fileURLToPath } from 'node:url';
import { extractFontType } from '../utils.js';

// https://fonts.nuxt.com/get-started/providers#local
// https://github.com/nuxt/fonts/blob/main/src/providers/local.ts
// https://github.com/unjs/unifont/blob/main/src/providers/google.ts

export const LOCAL_PROVIDER_NAME = 'local';

type InitializedProvider = NonNullable<Awaited<ReturnType<unifont.Provider>>>;

type ResolveFontResult = NonNullable<Awaited<ReturnType<InitializedProvider['resolveFont']>>>;

interface ResolveOptions {
	root: URL;
	proxyURL: (value: string) => string;
}

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
					src: src.paths.map((path) => {
						const originalURL = fileURLToPath(new URL(path, root));
						return {
							originalURL,
							url: proxyURL(originalURL),
							format: extractFontType(path),
						};
					}),
				});
			}
		}
	}

	return {
		fonts,
	};
}

/**
 * Orchestrates local font updates and deletions during development
 */
export class LocalFontsWatcher {
	/**
	 * Watched fonts files
	 */
	#paths: Array<string>;
	/**
	 * Action performed when a font file is updated
	 */
	#update: () => void;

	constructor({ paths, update }: { paths: Array<string>; update: () => void }) {
		this.#paths = paths;
		this.#update = update;
	}

	#matches(path: string): boolean {
		return this.#paths.includes(path);
	}

	/**
	 * Callback to call whenever a file is updated
	 */
	onUpdate(path: string): void {
		if (!this.#matches(path)) {
			return;
		}
		this.#update();
	}

	/**
	 * Callback to call whenever a file is unlinked
	 */
	onUnlink(path: string): void {
		if (!this.#matches(path)) {
			return;
		}
		// TODO: improve
		throw new Error('File used for font deleted. Restore it or update your config');
	}
}
