function validateAssetsPrefix(config) {
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
function validateRemotePatterns(remotePatterns) {
	const issues = [];
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
function validateI18nRedirectToDefaultLocale(i18n) {
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
function validateOutDirNotInPublicDir(outDir, publicDir) {
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
function validateI18nDefaultLocale(i18n) {
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
function validateI18nFallback(i18n) {
	const issues = [];
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
function validateI18nDomains(config) {
	const issues = [];
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
			} catch {}
		}
	}
	return issues;
}
function validateFontsCssVariables(fonts) {
	const issues = [];
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
export {
	validateAssetsPrefix,
	validateFontsCssVariables,
	validateI18nDefaultLocale,
	validateI18nDomains,
	validateI18nFallback,
	validateI18nRedirectToDefaultLocale,
	validateOutDirNotInPublicDir,
	validateRemotePatterns,
};
