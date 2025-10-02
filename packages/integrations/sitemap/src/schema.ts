import { EnumChangefreq as ChangeFreq } from 'sitemap';
import { z } from 'zod';
import { SITEMAP_CONFIG_DEFAULTS } from './config-defaults.js';

const localeKeySchema = z.string().min(1);

export const SitemapOptionsSchema = z
	.object({
		filenameBase: z.string().optional().default(SITEMAP_CONFIG_DEFAULTS.filenameBase),
		filter: z.function().args(z.string()).returns(z.boolean()).optional(),
		customSitemaps: z.string().url().array().optional(),
		customPages: z.string().url().array().optional(),
		canonicalURL: z.string().url().optional(),
		xslURL: z.string().optional(),

		i18n: z
			.object({
				defaultLocale: localeKeySchema,
				locales: z.record(
					localeKeySchema,
					z
						.string()
						.min(2)
						.regex(/^[a-zA-Z\-]+$/gm, {
							message: 'Only English alphabet symbols and hyphen allowed',
						}),
				),
			})
			.refine((val) => !val || val.locales[val.defaultLocale], {
				message: '`defaultLocale` must exist in `locales` keys',
			})
			.optional(),

		entryLimit: z.number().nonnegative().optional().default(SITEMAP_CONFIG_DEFAULTS.entryLimit),
		serialize: z.function().args(z.any()).returns(z.any()).optional(),

		changefreq: z.nativeEnum(ChangeFreq).optional(),
		lastmod: z.date().optional(),
		priority: z.number().min(0).max(1).optional(),

		namespaces: z
			.object({
				news: z.boolean().optional(),
				xhtml: z.boolean().optional(),
				image: z.boolean().optional(),
				video: z.boolean().optional(),
			})
			.optional()
			.default(SITEMAP_CONFIG_DEFAULTS.namespaces),
	})
	.strict()
	.default(SITEMAP_CONFIG_DEFAULTS);
