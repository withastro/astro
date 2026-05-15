import { getAllCodes, normalizeTheLocale, normalizeThePath } from './index.js';
function parseLocale(header) {
	if (header === '*') {
		return [{ locale: header, qualityValue: void 0 }];
	}
	const result = [];
	const localeValues = header.split(',').map((str) => str.trim());
	for (const localeValue of localeValues) {
		const split = localeValue.split(';').map((str) => str.trim());
		const localeName = split[0];
		const qualityValue = split[1];
		if (!split) {
			continue;
		}
		if (qualityValue && qualityValue.startsWith('q=')) {
			const qualityValueAsFloat = Number.parseFloat(qualityValue.slice('q='.length));
			if (Number.isNaN(qualityValueAsFloat) || qualityValueAsFloat > 1) {
				result.push({
					locale: localeName,
					qualityValue: void 0,
				});
			} else {
				result.push({
					locale: localeName,
					qualityValue: qualityValueAsFloat,
				});
			}
		} else {
			result.push({
				locale: localeName,
				qualityValue: void 0,
			});
		}
	}
	return result;
}
function sortAndFilterLocales(browserLocaleList, locales) {
	const normalizedLocales = getAllCodes(locales).map(normalizeTheLocale);
	return browserLocaleList
		.filter((browserLocale) => {
			if (browserLocale.locale !== '*') {
				return normalizedLocales.includes(normalizeTheLocale(browserLocale.locale));
			}
			return true;
		})
		.sort((a, b) => {
			if (a.qualityValue && b.qualityValue) {
				return Math.sign(b.qualityValue - a.qualityValue);
			}
			return 0;
		});
}
function computePreferredLocale(request, locales) {
	const acceptHeader = request.headers.get('Accept-Language');
	let result = void 0;
	if (acceptHeader) {
		const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
		const firstResult = browserLocaleList.at(0);
		if (firstResult && firstResult.locale !== '*') {
			outer: for (const currentLocale of locales) {
				if (typeof currentLocale === 'string') {
					if (normalizeTheLocale(currentLocale) === normalizeTheLocale(firstResult.locale)) {
						result = currentLocale;
						break;
					}
				} else {
					for (const currentCode of currentLocale.codes) {
						if (normalizeTheLocale(currentCode) === normalizeTheLocale(firstResult.locale)) {
							result = currentCode;
							break outer;
						}
					}
				}
			}
		}
	}
	return result;
}
function computePreferredLocaleList(request, locales) {
	const acceptHeader = request.headers.get('Accept-Language');
	let result = [];
	if (acceptHeader) {
		const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);
		if (browserLocaleList.length === 1 && browserLocaleList.at(0).locale === '*') {
			return getAllCodes(locales);
		} else if (browserLocaleList.length > 0) {
			for (const browserLocale of browserLocaleList) {
				for (const loopLocale of locales) {
					if (typeof loopLocale === 'string') {
						if (normalizeTheLocale(loopLocale) === normalizeTheLocale(browserLocale.locale)) {
							result.push(loopLocale);
						}
					} else {
						for (const code of loopLocale.codes) {
							if (code === browserLocale.locale) {
								result.push(code);
							}
						}
					}
				}
			}
		}
	}
	return result;
}
function computeCurrentLocale(pathname, locales, defaultLocale) {
	for (const segment of pathname.split('/').map(normalizeThePath)) {
		for (const locale of locales) {
			if (typeof locale === 'string') {
				if (!segment.includes(locale)) continue;
				if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
					return locale;
				}
			} else {
				if (locale.path === segment) {
					return locale.codes.at(0);
				} else {
					for (const code of locale.codes) {
						if (normalizeTheLocale(code) === normalizeTheLocale(segment)) {
							return code;
						}
					}
				}
			}
		}
	}
	for (const locale of locales) {
		if (typeof locale === 'string') {
			if (locale === defaultLocale) {
				return locale;
			}
		} else {
			if (locale.path === defaultLocale) {
				return locale.codes.at(0);
			}
		}
	}
}
function computeCurrentLocaleFromParams(params, locales) {
	const byNormalizedCode = /* @__PURE__ */ new Map();
	const byPath = /* @__PURE__ */ new Map();
	for (const locale of locales) {
		if (typeof locale === 'string') {
			byNormalizedCode.set(normalizeTheLocale(locale), locale);
		} else {
			byPath.set(locale.path, locale.codes[0]);
			for (const code of locale.codes) {
				byNormalizedCode.set(normalizeTheLocale(code), code);
			}
		}
	}
	for (const value of Object.values(params)) {
		if (!value) continue;
		const pathMatch = byPath.get(value);
		if (pathMatch) return pathMatch;
		const codeMatch = byNormalizedCode.get(normalizeTheLocale(value));
		if (codeMatch) return codeMatch;
	}
}
export {
	computeCurrentLocale,
	computeCurrentLocaleFromParams,
	computePreferredLocale,
	computePreferredLocaleList,
	parseLocale,
};
