import * as unifont from 'unifont';
import type { AstroFontProvider } from '../types.js';

/**
 * Astro re-exports most [unifont](https://github.com/unjs/unifont/) providers:
 * - [Adobe](https://fonts.adobe.com/)
 * - [Bunny](https://fonts.bunny.net/)
 * - [Fontshare](https://www.fontshare.com/)
 * - [Fontsource](https://fontsource.org/)
 * - [Google](https://fonts.google.com/)
 */
// TODO: need a fix in unifont upstream to export providers options
export const fontProviders = {
	/** [Adobe](https://fonts.adobe.com/) */
	adobe: unifontToAstroFontProvider(unifont.providers.adobe),
	/** [Bunny](https://fonts.bunny.net/) */
	bunny: unifontToAstroFontProvider(unifont.providers.bunny),
	/** [Fontshare](https://www.fontshare.com/) */
	fontshare: unifontToAstroFontProvider(unifont.providers.fontshare),
	/** [Fontsource](https://fontsource.org/) */
	fontsource: unifontToAstroFontProvider(unifont.providers.fontsource),
	/** [Google](https://fonts.google.com/) */
	google: unifontToAstroFontProvider(unifont.providers.google),
};

/** A type helper for defining Astro font providers config objects */
export function defineAstroFontProvider<T extends AstroFontProvider>(provider: T) {
	return provider;
}

/** TODO: */
// TODO: need a fix in unifont upstream to export ResolveFontResult
export function unifontToAstroFontProvider<T extends (options?: any) => unifont.Provider>(
	unifontProviderFactory: T,
) {
	return function (...[options]: Parameters<T>) {
		const unifontProvider = unifontProviderFactory(options);
		// TODO: need a fix in unifont upstream to export InitializedProvider
		let initializedProvider: Awaited<ReturnType<unifont.Provider>>;

		return defineAstroFontProvider({
			name: unifontProvider._name,
			options,
			async init(context) {
				initializedProvider = await unifontProvider(context);
				if (!initializedProvider) {
					// TODO: throw error
				}
			},
			async resolveFont({ familyName, ...rest }) {
				return await initializedProvider?.resolveFont(familyName, rest);
			},
			async listFonts() {
				return await initializedProvider?.listFonts?.();
			},
		});
	};
}
