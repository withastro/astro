import { z } from 'zod';
import { LOCAL_PROVIDER_NAME } from './constants.js';

const weightSchema = z.union([z.string(), z.number()]);
const styleSchema = z.enum(['normal', 'italic', 'oblique']);

const familyPropertiesSchema = z.object({
	/**
	 * A [font weight](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight). If the associated font is a [variable font](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), you can specify a range of weights:
	 *
	 * ```js
	 * weight: "100 900"
	 * ```
	 */
	weight: weightSchema,
	/**
	 * A [font style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style).
	 */
	style: styleSchema,
	/**
	 * @default `"swap"`
	 * 
	 * A [font display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display).
	 */
	display: z.enum(['auto', 'block', 'swap', 'fallback', 'optional']).optional(),
	/**
	 * A [unicode range](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/unicode-range).
	 */
	unicodeRange: z.array(z.string()).nonempty().optional(),
	/**
	 * A [font stretch](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-stretch).
	 */
	stretch: z.string().optional(),
	/**
	 * Font [feature settings](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-feature-settings).
	 */
	featureSettings: z.string().optional(),
	/**
	 * Font [variation settings](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-variation-settings).
	 */
	variationSettings: z.string().optional(),
});

const fallbacksSchema = z.object({
	/**
	 * @default `["sans-serif"]`
	 *
	 * An array of fonts to use when your chosen font is unavailable, or loading. Fallbacks are applied from left to right:
	 *
	 * ```js
	 * fallbacks: ["CustomFont", "serif"]
	 * ```
	 *
	 * If you don't want any fallbacks, use an empty array:
	 *
	 * ```js
	 * fallbacks: []
	 * ```
	 *
	 * If `optimizedFallbacks` is set to `true`, we look for the last fallback and check if it's a [generic family name](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family#generic-name). If so, we try to generate an [optimized fallback](https://developer.chrome.com/blog/font-fallbacks) using font metrics.
	 */
	fallbacks: z.array(z.string()).nonempty().optional(),
	/**
	 * @default `true`
	 *
	 * Whether or not to enable optimized fallback generation. Enabling this should only be needed if you want full control over the `fallbacks`.
	 */
	optimizedFallbacks: z.boolean().optional(),
});

export const requiredFamilyAttributesSchema = z.object({
	/**
	 * The font family name, as identified by your font provider.
	 */
	name: z.string(),
	/**
	 * A valid [ident](https://developer.mozilla.org/en-US/docs/Web/CSS/ident) in the form of a CSS variable.
	 */
	cssVariable: z.string(),
});

const entrypointSchema = z.union([z.string(), z.instanceof(URL)]);

export const fontProviderSchema = z
	.object({
		/**
		 * URL, path relative to the root or package import.
		 */
		entrypoint: entrypointSchema,
		/**
		 * Optional serializable object passed to the unifont provider.
		 */
		config: z.record(z.string(), z.any()).optional(),
	})
	.strict();

export const localFontFamilySchema = requiredFamilyAttributesSchema
	.merge(fallbacksSchema)
	.merge(
		z.object({
			/**
			 * The source of your font files. Set to `"local"` to use local font files.
			 */
			provider: z.literal(LOCAL_PROVIDER_NAME),
			/**
			 * Each variant represents a [`@font-face` declaration](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/).
			 */
			variants: z
				.array(
					familyPropertiesSchema.merge(
						z
							.object({
								/**
								 * Font [sources](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/src). It can be a path relative to the root, a package import or a URL. URLs are particularly useful if you inject local fonts through an integration.
								 */
								src: z
									.array(
										z.union([
											entrypointSchema,
											z.object({ url: entrypointSchema, tech: z.string().optional() }).strict(),
										]),
									)
									.nonempty(),
								// TODO: find a way to support subsets (through fontkit?)
							})
							.strict(),
					),
				)
				.nonempty(),
		}),
	)
	.strict();

export const remoteFontFamilySchema = requiredFamilyAttributesSchema
	.merge(
		familyPropertiesSchema.omit({
			weight: true,
			style: true,
		}),
	)
	.merge(fallbacksSchema)
	.merge(
		z.object({
			/**
			 * The source of your font files. You can use a built-in provider or write your own custom provider.
			 */
			provider: fontProviderSchema,
			/**
			 * @default `[400]`
			 *
			 * An array of [font weights](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight). If the associated font is a [variable font](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_fonts/Variable_fonts_guide), you can specify a range of weights:
			 *
			 * ```js
			 * weight: "100 900"
			 * ```
			 */
			weights: z.array(weightSchema).nonempty().optional(),
			/**
			 * @default `["normal", "italic"]`
			 *
			 * An array of [font styles](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style).
			 */
			styles: z.array(styleSchema).nonempty().optional(),
			// TODO: better link
			/**
			 * @default `["cyrillic-ext", "cyrillic", "greek-ext", "greek", "vietnamese", "latin-ext", "latin"]`
			 *
			 * An array of [font subsets](https://fonts.google.com/knowledge/glossary/subsetting):
			 */
			subsets: z.array(z.string()).nonempty().optional(),
		}),
	)
	.strict();
