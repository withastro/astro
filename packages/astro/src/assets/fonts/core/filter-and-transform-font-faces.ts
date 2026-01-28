import type * as unifont from 'unifont';
import { FONT_FORMATS } from '../constants.js';
import type { FontFileIdGenerator, FontTypeExtractor, UrlResolver } from '../definitions.js';
import type { ResolvedFontFamily } from '../types.js';

export function filterAndTransformFontFaces({
	fonts,
	fontTypeExtractor,
	fontFileIdGenerator,
	urlResolver,
	family,
}: {
	fonts: Array<unifont.FontFaceData>;
	fontTypeExtractor: FontTypeExtractor;
	fontFileIdGenerator: FontFileIdGenerator;
	urlResolver: UrlResolver;
	family: Pick<ResolvedFontFamily, 'cssVariable'>;
}) {
	return (
		fonts
			// Avoid getting too much font files
			.filter((font) => (typeof font.meta?.priority === 'number' ? font.meta.priority <= 1 : true))
			// Collect URLs
			.map((font) => ({
				...font,
				src: font.src.map((source) => {
					if ('name' in source) {
						return source;
					}
					// We handle protocol relative URLs here, otherwise they're considered absolute by the font
					// fetcher which will try to read them from the file system
					const originalUrl = source.url.startsWith('//') ? `https:${source.url}` : source.url;
					let format = FONT_FORMATS.find((e) => e.format === source.format);
					if (!format) {
						format = FONT_FORMATS.find((e) => e.type === fontTypeExtractor.extract(source.url))!;
					}
					const id = fontFileIdGenerator.generate({
						cssVariable: family.cssVariable,
						font,
						originalUrl,
						type: format.type,
					});
					const url = urlResolver.resolve(id);

					const newSource: unifont.RemoteFontSource = {
						originalURL: originalUrl,
						url,
						format: format.format,
						tech: source.tech,
					};
					return newSource;
				}),
			}))
	);
}
