import { EnumChangefreq as ChangeFreq } from 'sitemap';
import * as z from 'zod/v4';
import { SITEMAP_CONFIG_DEFAULTS } from './config-defaults.js';

const localeKeySchema = z.string().min(1);

export const SitemapOptionsSchema = z
	.object({
		filenameBase: z.string().optional().prefault(SITEMAP_CONFIG_DEFAULTS.filenameBase),
		filter: z.function({ input: [z.string()], output: z.boolean() }).optional(),
		customSitemaps: z.array(z.url()).optional(),
		customPages: z.array(z.url()).optional(),
		canonicalURL: z.url().optional(),
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
		serialize: z.function({ input: [z.any()], output: z.any() }).optional(),

		changefreq: z.enum(ChangeFreq).optional(),
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
		chunks: z.record(z.string(), z.function({ input: [z.any()], output: z.any() })).optional(),
	})
	.strict()
	.default(SITEMAP_CONFIG_DEFAULTS);
