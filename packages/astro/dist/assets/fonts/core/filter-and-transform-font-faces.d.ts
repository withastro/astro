import type * as unifont from 'unifont';
import type { FontFileIdGenerator, FontTypeExtractor, UrlResolver } from '../definitions.js';
import type { ResolvedFontFamily } from '../types.js';
export declare function filterAndTransformFontFaces({
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
}): {
	src: (unifont.LocalFontSource | unifont.RemoteFontSource)[];
	display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
	weight?: string | number | [number, number];
	stretch?: string;
	style?: string;
	unicodeRange?: string[];
	featureSettings?: string;
	variationSettings?: string;
	meta?: unifont.FontFaceMeta;
}[];
