import { EnumChangefreq as ChangeFreq } from 'sitemap';
import * as z from 'zod/v4';
export declare const SitemapOptionsSchema: z.ZodDefault<
	z.ZodObject<
		{
			filenameBase: z.ZodPrefault<z.ZodOptional<z.ZodString>>;
			filter: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodString], null>, z.ZodBoolean>>;
			customSitemaps: z.ZodOptional<z.ZodArray<z.ZodURL>>;
			customPages: z.ZodOptional<z.ZodArray<z.ZodURL>>;
			canonicalURL: z.ZodOptional<z.ZodURL>;
			xslURL: z.ZodOptional<z.ZodString>;
			i18n: z.ZodOptional<
				z.ZodObject<
					{
						defaultLocale: z.ZodString;
						locales: z.ZodRecord<z.ZodString, z.ZodString>;
					},
					z.core.$strip
				>
			>;
			entryLimit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
			serialize: z.ZodOptional<z.ZodFunction<z.ZodTuple<readonly [z.ZodAny], null>, z.ZodAny>>;
			changefreq: z.ZodOptional<z.ZodEnum<typeof ChangeFreq>>;
			lastmod: z.ZodOptional<z.ZodDate>;
			priority: z.ZodOptional<z.ZodNumber>;
			namespaces: z.ZodDefault<
				z.ZodOptional<
					z.ZodObject<
						{
							news: z.ZodOptional<z.ZodBoolean>;
							xhtml: z.ZodOptional<z.ZodBoolean>;
							image: z.ZodOptional<z.ZodBoolean>;
							video: z.ZodOptional<z.ZodBoolean>;
						},
						z.core.$strip
					>
				>
			>;
			chunks: z.ZodOptional<
				z.ZodRecord<z.ZodString, z.ZodFunction<z.ZodTuple<readonly [z.ZodAny], null>, z.ZodAny>>
			>;
		},
		z.core.$strict
	>
>;
