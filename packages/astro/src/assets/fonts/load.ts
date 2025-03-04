import { readFileSync } from 'node:fs';
import { resolveLocalFont } from './providers/local.js';
import { resolveProviders, type ResolveMod } from './providers/utils.js';
import { generateFallbacksCSS, generateFontFace, proxyURL, type ProxyURLOptions } from './utils.js';
import * as unifont from 'unifont';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { DEFAULTS, LOCAL_PROVIDER_NAME } from './constants.js';
import type { FontFamily, FontProvider, PreloadData } from './types.js';
import type { Storage } from 'unstorage';

interface Options
	extends Pick<Parameters<typeof proxyURL>[0], 'hashString'>,
		Pick<Parameters<typeof generateFallbacksCSS>[0], 'generateFontFace' | 'getMetricsForFamily'> {
	root: URL;
	base: string;
	providers: Array<FontProvider<string>>;
	families: Array<FontFamily<'local' | 'custom'>>;
	storage: Storage;
	hashToUrlMap: Map<string, string>;
	resolvedMap: Map<string, { preloadData: PreloadData; css: string }>;
	resolveMod: ResolveMod;
	log: (message: string) => void;
}

export async function loadFonts({
	root,
	base,
	providers,
	families,
	storage,
	hashToUrlMap,
	resolvedMap,
	resolveMod,
	hashString,
	generateFontFace: generateFallbackFontFace,
	getMetricsForFamily,
	log,
}: Options): Promise<void> {
	const resolved = await resolveProviders({
		root,
		providers,
		resolveMod,
	});

	const { resolveFont } = await unifont.createUnifont(
		resolved.map((e) => e.provider(e.config)),
		{ storage },
	);

	for (const family of families) {
		const preloadData: PreloadData = [];
		let css = '';

		// When going through the urls/filepaths returned by providers,
		// We save the hash and the associated original value so we can use
		// it in the vite middleware during development
		const collect: ProxyURLOptions['collect'] = ({ hash, type, value }) => {
			const url = base + hash;
			if (!hashToUrlMap.has(hash)) {
				hashToUrlMap.set(hash, value);
				preloadData.push({ url, type });
			}
			return url;
		};

		let fonts: Array<unifont.FontFaceData>;

		if (family.provider === LOCAL_PROVIDER_NAME) {
			const result = resolveLocalFont(family, {
				proxyURL: (value) => {
					return proxyURL({
						value,
						// We hash based on the filepath and the contents, since the user could replace
						// a given font file with completely different contents.
						hashString: (v) => {
							let content: string;
							try {
								content = readFileSync(value, 'utf-8');
							} catch (e) {
								throw new AstroError(AstroErrorData.UnknownFilesystemError, { cause: e });
							}
							return hashString(v + content);
						},
						collect,
					});
				},
				root,
			});
			fonts = result.fonts;
		} else {
			const result = await resolveFont(
				family.name,
				// We do not merge the defaults, we only provide defaults as a fallback
				{
					weights: family.weights ?? DEFAULTS.weights,
					styles: family.styles ?? DEFAULTS.styles,
					subsets: family.subsets ?? DEFAULTS.subsets,
					// No default fallback to be used here
					fallbacks: family.fallbacks,
				},
				// By default, fontaine goes through all providers. We use a different approach
				// where we specify a provider per font (default to google)
				[family.provider],
			);

			fonts = result.fonts.map((font) => ({
				...font,
				src: font.src.map((source) =>
					'name' in source
						? source
						: {
								...source,
								originalURL: source.url,
								url: proxyURL({
									value: source.url,
									// We only use the url for hashing since the service returns urls with a hash already
									hashString,
									collect,
								}),
							},
				),
			}));
		}

		for (const data of fonts) {
			css += generateFontFace(family.name, data);
		}
		const urls = fonts
			.flatMap((font) => font.src.map((src) => ('originalURL' in src ? src.originalURL : null)))
			.filter(Boolean);

		const fallbackData = await generateFallbacksCSS({
			family: family.name,
			fallbacks: family.fallbacks ?? [],
			fontURL: urls.at(0) ?? null,
			getMetricsForFamily,
			generateFontFace: generateFallbackFontFace,
		});

		if (fallbackData) {
			css += fallbackData.css;
			// TODO: generate css var
		}

		resolvedMap.set(family.name, { preloadData, css });
	}
	log('Fonts initialized');
}
