import type { AstroConfig } from '../../../types/public/config.js';

export interface ConfigValidationIssue {
	message: string;
	path: (string | number)[];
}

type I18nConfig = NonNullable<AstroConfig['i18n']>;

/**
 * Validates that `build.assetsPrefix`, when specified as an object, includes a `fallback` key.
 */
export function validateAssetsPrefix(config: Pick<AstroConfig, 'build'>): ConfigValidationIssue[] {
	if (
		config.build.assetsPrefix &&
		typeof config.build.assetsPrefix !== 'string' &&
		!config.build.assetsPrefix.fallback
	) {
		return [
			{
				message: 'The `fallback` is mandatory when defining the option as an object.',
				path: ['build', 'assetsPrefix'],
			},
		];
	}
	return [];
}

/**
 * Validates that remote pattern wildcards are only at the start of hostnames
 * and at the end of pathnames.
 */
export function validateRemotePatterns(
	remotePatterns: AstroConfig['image']['remotePatterns'],
): ConfigValidationIssue[] {
	const issues: ConfigValidationIssue[] = [];
	for (let i = 0; i < remotePatterns.length; i++) {
		const { hostname, pathname } = remotePatterns[i];

		if (
			hostname &&
			hostname.includes('*') &&
			!(hostname.startsWith('*.') || hostname.startsWith('**.'))
		) {
			issues.push({
				message: 'wildcards can only be placed at the beginning of the hostname',
				path: ['image', 'remotePatterns', i, 'hostname'],
			});
		}

		if (
			pathname &&
			pathname.includes('*') &&
			!(pathname.endsWith('/*') || pathname.endsWith('/**'))
		) {
			issues.push({
				message: 'wildcards can only be placed at the end of a pathname',
				path: ['image', 'remotePatterns', i, 'pathname'],
			});
		}
	}
	return issues;
}

/**
 * Validates that `redirectToDefaultLocale` is not `true` when
 * `prefixDefaultLocale` is `false`, which would cause infinite redirects.
 */
export function validateI18nRedirectToDefaultLocale(
	i18n: AstroConfig['i18n'],
): ConfigValidationIssue[] {
	if (
		i18n &&
		typeof i18n.routing !== 'string' &&
		i18n.routing.prefixDefaultLocale === false &&
		i18n.routing.redirectToDefaultLocale === true
	) {
		return [
			{
				message:
					'The option `i18n.routing.redirectToDefaultLocale` can be used only when `i18n.routing.prefixDefaultLocale` is set to `true`; otherwise, redirects might cause infinite loops. Remove the option `i18n.routing.redirectToDefaultLocale`, or change its value to `false`.',
				path: ['i18n', 'routing', 'redirectToDefaultLocale'],
			},
		];
	}
	return [];
}

/**
 * Validates that `outDir` is not inside `publicDir`, which would cause an infinite loop.
 */
export function validateOutDirNotInPublicDir(
	outDir: AstroConfig['outDir'],
	publicDir: AstroConfig['publicDir'],
): ConfigValidationIssue[] {
	if (outDir.toString().startsWith(publicDir.toString())) {
		return [
			{
				message:
					'The value of `outDir` must not point to a path within the folder set as `publicDir`, this will cause an infinite loop',
				path: ['outDir'],
			},
		];
	}
	return [];
}

/**
 * Validates that the default locale is present in the locales array.
 */
export function validateI18nDefaultLocale(
	i18n: Pick<I18nConfig, 'defaultLocale' | 'locales'>,
): ConfigValidationIssue[] {
	const locales = i18n.locales.map((locale) => (typeof locale === 'string' ? locale : locale.path));
	if (!locales.includes(i18n.defaultLocale)) {
		return [
			{
				message: `The default locale \`${i18n.defaultLocale}\` is not present in the \`i18n.locales\` array.`,
				path: ['i18n', 'locales'],
			},
		];
	}
	return [];
}

/**
 * Validates i18n fallback entries: keys and values must exist in locales,
 * and the default locale cannot be used as a key.
 */
export function validateI18nFallback(
	i18n: Pick<I18nConfig, 'defaultLocale' | 'locales' | 'fallback'>,
): ConfigValidationIssue[] {
	const issues: ConfigValidationIssue[] = [];
	const { defaultLocale, fallback } = i18n;
	if (!fallback) return [];

	const locales = i18n.locales.map((locale) => (typeof locale === 'string' ? locale : locale.path));

	for (const [fallbackFrom, fallbackTo] of Object.entries(fallback)) {
		if (!locales.includes(fallbackFrom)) {
			issues.push({
				message: `The locale \`${fallbackFrom}\` key in the \`i18n.fallback\` record doesn't exist in the \`i18n.locales\` array.`,
				path: ['i18n', 'fallbacks'],
			});
		}

		if (fallbackFrom === defaultLocale) {
			issues.push({
				message: `You can't use the default locale as a key. The default locale can only be used as value.`,
				path: ['i18n', 'fallbacks'],
			});
		}

		if (!locales.includes(fallbackTo)) {
			issues.push({
				message: `The locale \`${fallbackTo}\` value in the \`i18n.fallback\` record doesn't exist in the \`i18n.locales\` array.`,
				path: ['i18n', 'fallbacks'],
			});
		}
	}
	return issues;
}

/**
 * Validates i18n domain entries: locale keys must exist, domain values must be
 * valid origin URLs, site must be set, and output must be 'server'.
 */
export function validateI18nDomains(
	config: Pick<AstroConfig, 'site' | 'output' | 'i18n'>,
): ConfigValidationIssue[] {
	const issues: ConfigValidationIssue[] = [];
	const i18n = config.i18n;
	if (!i18n?.domains) return [];

	const entries = Object.entries(i18n.domains);
	const hasDomains = Object.keys(i18n.domains).length > 0;

	if (entries.length > 0 && !hasDomains) {
		issues.push({
			message: `When specifying some domains, the property \`i18n.routing.strategy\` must be set to \`"domains"\`.`,
			path: ['i18n', 'routing', 'strategy'],
		});
	}

	if (hasDomains) {
		if (!config.site) {
			issues.push({
				message:
					"The option `site` isn't set. When using the 'domains' strategy for `i18n`, `site` is required to create absolute URLs for locales that aren't mapped to a domain.",
				path: ['site'],
			});
		}
		if (config.output !== 'server') {
			issues.push({
				message: 'Domain support is only available when `output` is `"server"`.',
				path: ['output'],
			});
		}
	}

	const locales = i18n.locales.map((locale) => (typeof locale === 'string' ? locale : locale.path));

	for (const [domainKey, domainValue] of entries) {
		if (!locales.includes(domainKey)) {
			issues.push({
				message: `The locale \`${domainKey}\` key in the \`i18n.domains\` record doesn't exist in the \`i18n.locales\` array.`,
				path: ['i18n', 'domains'],
			});
		}
		if (!domainValue.startsWith('https') && !domainValue.startsWith('http')) {
			issues.push({
				message:
					"The domain value must be a valid URL, and it has to start with 'https' or 'http'.",
				path: ['i18n', 'domains'],
			});
		} else {
			try {
				const domainUrl = new URL(domainValue);
				if (domainUrl.pathname !== '/') {
					issues.push({
						message: `The URL \`${domainValue}\` must contain only the origin. A subsequent pathname isn't allowed here. Remove \`${domainUrl.pathname}\`.`,
						path: ['i18n', 'domains'],
					});
				}
			} catch {
				// no need to catch the error
			}
		}
	}
	return issues;
}

/**
 * Validates that font `cssVariable` values start with `--` and don't contain
 * spaces or colons.
 */
export function validateFontsCssVariables(
	fonts: NonNullable<AstroConfig['fonts']>,
): ConfigValidationIssue[] {
	const issues: ConfigValidationIssue[] = [];
	for (let i = 0; i < fonts.length; i++) {
		const { cssVariable } = fonts[i];
		if (!cssVariable.startsWith('--') || cssVariable.includes(' ') || cssVariable.includes(':')) {
			issues.push({
				message: `**cssVariable** property "${cssVariable}" contains invalid characters for CSS variable generation. It must start with -- and be a valid indent: https://developer.mozilla.org/en-US/docs/Web/CSS/ident.`,
				path: ['fonts', i, 'cssVariable'],
			});
		}
	}
	return issues;
}
