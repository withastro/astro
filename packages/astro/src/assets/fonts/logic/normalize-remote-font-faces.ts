import type * as unifont from 'unifont';
import type { FontTypeExtractor, UrlProxy } from '../definitions.js';
import { FONT_FORMATS } from '../constants.js';

export function normalizeRemoteFontFaces({
	fonts,
	urlProxy,
	fontTypeExtractor,
}: {
	fonts: Array<unifont.FontFaceData>;
	urlProxy: UrlProxy;
	fontTypeExtractor: FontTypeExtractor;
}): Array<unifont.FontFaceData> {
	return (
		fonts
			// Avoid getting too much font files
			.filter((font) => (typeof font.meta?.priority === 'number' ? font.meta.priority === 0 : true))
			// Collect URLs
			.map((font) => {
				// The index keeps track of encountered URLs. We can't use the index on font.src.map
				// below because it may contain sources without urls, which would prevent preloading completely
				let index = 0;
				return {
					...font,
					src: font.src.map((source) => {
						if ('name' in source) {
							return source;
						}
						const proxied = {
							...source,
							originalURL: source.url,
							url: urlProxy.proxy({
								url: source.url,
								type:
									FONT_FORMATS.find((e) => e.format === source.format)?.type ??
									fontTypeExtractor.extract(source.url),
								// We only collect the first URL to avoid preloading fallback sources (eg. we only
								// preload woff2 if woff is available)
								collectPreload: index === 0,
								data: {
									weight: font.weight,
									style: font.style,
								},
								init: font.meta?.init ?? null,
							}),
						};
						index++;
						return proxied;
					}),
				};
			})
	);
}
