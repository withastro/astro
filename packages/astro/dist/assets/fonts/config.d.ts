import * as z from 'zod/v4';
import type { FontProvider } from './types.js';
export declare const WeightSchema: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
export declare const StyleSchema: z.ZodEnum<{
	normal: 'normal';
	italic: 'italic';
	oblique: 'oblique';
}>;
export declare const DisplaySchema: z.ZodEnum<{
	optional: 'optional';
	auto: 'auto';
	block: 'block';
	swap: 'swap';
	fallback: 'fallback';
}>;
export declare const FontProviderSchema: z.ZodCustom<FontProvider<never>, FontProvider<never>>;
export declare const FontFamilySchema: z.ZodObject<
	{
		name: z.ZodString;
		cssVariable: z.ZodString;
		provider: z.ZodCustom<FontProvider<never>, FontProvider<never>>;
		weights: z.ZodOptional<
			z.ZodTuple<
				[z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>],
				z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>
			>
		>;
		styles: z.ZodOptional<
			z.ZodTuple<
				[
					z.ZodEnum<{
						normal: 'normal';
						italic: 'italic';
						oblique: 'oblique';
					}>,
				],
				z.ZodEnum<{
					normal: 'normal';
					italic: 'italic';
					oblique: 'oblique';
				}>
			>
		>;
		subsets: z.ZodOptional<z.ZodTuple<[z.ZodString], z.ZodString>>;
		formats: z.ZodOptional<
			z.ZodTuple<
				[
					z.ZodEnum<{
						woff2: 'woff2';
						woff: 'woff';
						otf: 'otf';
						ttf: 'ttf';
						eot: 'eot';
					}>,
				],
				z.ZodEnum<{
					woff2: 'woff2';
					woff: 'woff';
					otf: 'otf';
					ttf: 'ttf';
					eot: 'eot';
				}>
			>
		>;
		fallbacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
		optimizedFallbacks: z.ZodOptional<z.ZodBoolean>;
		display: z.ZodOptional<
			z.ZodEnum<{
				optional: 'optional';
				auto: 'auto';
				block: 'block';
				swap: 'swap';
				fallback: 'fallback';
			}>
		>;
		stretch: z.ZodOptional<z.ZodString>;
		featureSettings: z.ZodOptional<z.ZodString>;
		variationSettings: z.ZodOptional<z.ZodString>;
		unicodeRange: z.ZodOptional<z.ZodTuple<[z.ZodString], z.ZodString>>;
		options: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
	},
	z.core.$strict
>;
