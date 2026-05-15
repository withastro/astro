import { FONT_FORMATS } from '../constants.js';
function filterAndTransformFontFaces({
	fonts,
	fontTypeExtractor,
	fontFileIdGenerator,
	urlResolver,
	family,
}) {
	return fonts
		.filter((font) => (typeof font.meta?.priority === 'number' ? font.meta.priority <= 1 : true))
		.map((font) => ({
			...font,
			src: font.src.map((source) => {
				if ('name' in source) {
					return source;
				}
				const originalUrl = source.url.startsWith('//') ? `https:${source.url}` : source.url;
				let format = FONT_FORMATS.find((e) => e.format === source.format);
				if (!format) {
					format = FONT_FORMATS.find((e) => e.type === fontTypeExtractor.extract(source.url));
				}
				const id = fontFileIdGenerator.generate({
					cssVariable: family.cssVariable,
					font,
					originalUrl,
					type: format.type,
				});
				const url = urlResolver.resolve(id);
				const newSource = {
					originalURL: originalUrl,
					url,
					format: format.format,
					tech: source.tech,
				};
				return newSource;
			}),
		}));
}
export { filterAndTransformFontFaces };
