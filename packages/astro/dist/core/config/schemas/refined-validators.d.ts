import type { AstroConfig } from '../../../types/public/config.js';
export interface ConfigValidationIssue {
	message: string;
	path: (string | number)[];
}
type I18nConfig = NonNullable<AstroConfig['i18n']>;
/**
 * Validates that `build.assetsPrefix`, when specified as an object, includes a `fallback` key.
 */
export declare function validateAssetsPrefix(
	config: Pick<AstroConfig, 'build'>,
): ConfigValidationIssue[];
/**
 * Validates that remote pattern wildcards are only at the start of hostnames
 * and at the end of pathnames.
 */
export declare function validateRemotePatterns(
	remotePatterns: AstroConfig['image']['remotePatterns'],
): ConfigValidationIssue[];
/**
 * Validates that `redirectToDefaultLocale` is not `true` when
 * `prefixDefaultLocale` is `false`, which would cause infinite redirects.
 */
export declare function validateI18nRedirectToDefaultLocale(
	i18n: AstroConfig['i18n'],
): ConfigValidationIssue[];
/**
 * Validates that `outDir` is not inside `publicDir`, which would cause an infinite loop.
 */
export declare function validateOutDirNotInPublicDir(
	outDir: AstroConfig['outDir'],
	publicDir: AstroConfig['publicDir'],
): ConfigValidationIssue[];
/**
 * Validates that the default locale is present in the locales array.
 */
export declare function validateI18nDefaultLocale(
	i18n: Pick<I18nConfig, 'defaultLocale' | 'locales'>,
): ConfigValidationIssue[];
/**
 * Validates i18n fallback entries: keys and values must exist in locales,
 * and the default locale cannot be used as a key.
 */
export declare function validateI18nFallback(
	i18n: Pick<I18nConfig, 'defaultLocale' | 'locales' | 'fallback'>,
): ConfigValidationIssue[];
/**
 * Validates i18n domain entries: locale keys must exist, domain values must be
 * valid origin URLs, site must be set, and output must be 'server'.
 */
export declare function validateI18nDomains(
	config: Pick<AstroConfig, 'site' | 'output' | 'i18n'>,
): ConfigValidationIssue[];
/**
 * Validates that font `cssVariable` values start with `--` and don't contain
 * spaces or colons.
 */
export declare function validateFontsCssVariables(
	fonts: NonNullable<AstroConfig['fonts']>,
): ConfigValidationIssue[];
export {};
