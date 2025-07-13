import { z } from 'zod';
import type { AstroConfig } from '../../../types/public/config.js';

export const AstroConfigRefinedSchema = z.custom<AstroConfig>().superRefine((config, ctx) => {
	if (
		config.build.assetsPrefix &&
		typeof config.build.assetsPrefix !== 'string' &&
		!config.build.assetsPrefix.fallback
	) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'The `fallback` is mandatory when defining the option as an object.',
			path: ['build', 'assetsPrefix'],
		});
	}

	for (let i = 0; i < config.image.remotePatterns.length; i++) {
		const { hostname, pathname } = config.image.remotePatterns[i];

		if (
			hostname &&
			hostname.includes('*') &&
			!(hostname.startsWith('*.') || hostname.startsWith('**.'))
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'wildcards can only be placed at the beginning of the hostname',
				path: ['image', 'remotePatterns', i, 'hostname'],
			});
		}

		if (
			pathname &&
			pathname.includes('*') &&
			!(pathname.endsWith('/*') || pathname.endsWith('/**'))
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'wildcards can only be placed at the end of a pathname',
				path: ['image', 'remotePatterns', i, 'pathname'],
			});
		}
	}

	// TODO: Astro 6.0
	// Uncomment this validation check, and change the default value of redirectToDefaultLocale to false
	// if (
	// 	config.i18n &&
	// 	typeof config.i18n.routing !== 'string' &&
	// 	config.i18n.routing.prefixDefaultLocale === false &&
	// 	config.i18n.routing.redirectToDefaultLocale === true
	// ) {
	// 	ctx.addIssue({
	// 		code: z.ZodIssueCode.custom,
	// 		message:
	// 			'The option `i18n.routing.redirectToDefaultLocale` can be used only when `i18n.routing.prefixDefaultLocale` is set to `true`, otherwise redirects might cause infinite loops. Remove the option `i18n.routing.redirectToDefaultLocale`, or change its value to `false`.',
	// 		path: ['i18n', 'routing', 'redirectToDefaultLocale'],
	// 	});
	// }

	if (config.outDir.toString().startsWith(config.publicDir.toString())) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				'The value of `outDir` must not point to a path within the folder set as `publicDir`, this will cause an infinite loop',
			path: ['outDir'],
		});
	}

	if (config.i18n) {
		const { defaultLocale, locales: _locales, fallback, domains } = config.i18n;
		const locales = _locales.map((locale) => {
			if (typeof locale === 'string') {
				return locale;
			} else {
				return locale.path;
			}
		});
		if (!locales.includes(defaultLocale)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `The default locale \`${defaultLocale}\` is not present in the \`i18n.locales\` array.`,
				path: ['i18n', 'locales'],
			});
		}
		if (fallback) {
			for (const [fallbackFrom, fallbackTo] of Object.entries(fallback)) {
				if (!locales.includes(fallbackFrom)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `The locale \`${fallbackFrom}\` key in the \`i18n.fallback\` record doesn't exist in the \`i18n.locales\` array.`,
						path: ['i18n', 'fallbacks'],
					});
				}

				if (fallbackFrom === defaultLocale) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `You can't use the default locale as a key. The default locale can only be used as value.`,
						path: ['i18n', 'fallbacks'],
					});
				}

				if (!locales.includes(fallbackTo)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `The locale \`${fallbackTo}\` value in the \`i18n.fallback\` record doesn't exist in the \`i18n.locales\` array.`,
						path: ['i18n', 'fallbacks'],
					});
				}
			}
		}
		if (domains) {
			const entries = Object.entries(domains);
			const hasDomains = domains ? Object.keys(domains).length > 0 : false;
			if (entries.length > 0 && !hasDomains) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `When specifying some domains, the property \`i18n.routing.strategy\` must be set to \`"domains"\`.`,
					path: ['i18n', 'routing', 'strategy'],
				});
			}

			if (hasDomains) {
				if (!config.site) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message:
							"The option `site` isn't set. When using the 'domains' strategy for `i18n`, `site` is required to create absolute URLs for locales that aren't mapped to a domain.",
						path: ['site'],
					});
				}
				if (config.output !== 'server') {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Domain support is only available when `output` is `"server"`.',
						path: ['output'],
					});
				}
			}

			for (const [domainKey, domainValue] of entries) {
				if (!locales.includes(domainKey)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `The locale \`${domainKey}\` key in the \`i18n.domains\` record doesn't exist in the \`i18n.locales\` array.`,
						path: ['i18n', 'domains'],
					});
				}
				if (!domainValue.startsWith('https') && !domainValue.startsWith('http')) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message:
							"The domain value must be a valid URL, and it has to start with 'https' or 'http'.",
						path: ['i18n', 'domains'],
					});
				} else {
					try {
						const domainUrl = new URL(domainValue);
						if (domainUrl.pathname !== '/') {
							ctx.addIssue({
								code: z.ZodIssueCode.custom,
								message: `The URL \`${domainValue}\` must contain only the origin. A subsequent pathname isn't allowed here. Remove \`${domainUrl.pathname}\`.`,
								path: ['i18n', 'domains'],
							});
						}
					} catch {
						// no need to catch the error
					}
				}
			}
		}
	}

	if (config.experimental.fonts && config.experimental.fonts.length > 0) {
		for (let i = 0; i < config.experimental.fonts.length; i++) {
			const { cssVariable } = config.experimental.fonts[i];

			// Checks if the name starts with --, doesn't include a space nor a colon.
			// We are not trying to recreate the full CSS spec about indents:
			// https://developer.mozilla.org/en-US/docs/Web/CSS/ident
			if (!cssVariable.startsWith('--') || cssVariable.includes(' ') || cssVariable.includes(':')) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `**cssVariable** property "${cssVariable}" contains invalid characters for CSS variable generation. It must start with -- and be a valid indent: https://developer.mozilla.org/en-US/docs/Web/CSS/ident.`,
					path: ['fonts', i, 'cssVariable'],
				});
			}
		}
	}
});
