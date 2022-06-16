import { z } from 'zod';
import { changefreqValues } from './constants';
import { SITEMAP_CONFIG_DEFAULTS } from './config-defaults';

const localeKeySchema = () => z.string().min(1);

const isFunction = (fn: any) => fn instanceof Function;

const fnSchema = () =>
	z
		.any()
		.refine((val) => !val || isFunction(val), { message: 'Not a function' })
		.optional();

export const SitemapOptionsSchema = z
	.object({
		filter: fnSchema(),
		customPages: z.string().url().array().optional(),
		canonicalURL: z.string().url().optional(),

		i18n: z
			.object({
				defaultLocale: localeKeySchema(),
				locales: z.record(
					localeKeySchema(),
					z
						.string()
						.min(2)
						.regex(/^[a-zA-Z\-]+$/gm, {
							message: 'Only English alphabet symbols and hyphen allowed',
						})
				),
			})
			.refine((val) => !val || val.locales[val.defaultLocale], {
				message: '`defaultLocale` must exists in `locales` keys',
			})
			.optional(),

		entryLimit: z.number().nonnegative().default(SITEMAP_CONFIG_DEFAULTS.entryLimit),
		serialize: fnSchema(),

		changefreq: z.enum(changefreqValues).optional(),
		lastmod: z.date().optional(),
		priority: z.number().min(0).max(1).optional(),
	})
	.strict()
	.default(SITEMAP_CONFIG_DEFAULTS);
