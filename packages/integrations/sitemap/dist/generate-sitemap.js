import { parseI18nUrl } from './utils/parse-i18n-url.js';
function generateSitemap(pages, finalSiteUrl, opts) {
	const { changefreq, priority, lastmod: lastmodSrc, i18n } = opts ?? {};
	const urls = [...pages];
	urls.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
	const lastmod = lastmodSrc?.toISOString();
	const { defaultLocale, locales } = i18n ?? {};
	let getI18nLinks;
	if (defaultLocale && locales) {
		getI18nLinks = createGetI18nLinks(urls, defaultLocale, locales, finalSiteUrl);
	}
	const urlData = urls.map((url, i) => ({
		url,
		links: getI18nLinks?.(i),
		lastmod,
		priority,
		changefreq,
	}));
	return urlData;
}
function createGetI18nLinks(urls, defaultLocale, locales, finalSiteUrl) {
	const parsedI18nUrls = urls.map((url) => parseI18nUrl(url, defaultLocale, locales, finalSiteUrl));
	const i18nPathToLinksCache = /* @__PURE__ */ new Map();
	return (urlIndex) => {
		const i18nUrl = parsedI18nUrls[urlIndex];
		if (!i18nUrl) {
			return void 0;
		}
		const cached = i18nPathToLinksCache.get(i18nUrl.path);
		if (cached) {
			return cached;
		}
		const links = [];
		for (let i = 0; i < parsedI18nUrls.length; i++) {
			const parsed = parsedI18nUrls[i];
			if (parsed?.path === i18nUrl.path) {
				links.push({
					url: urls[i],
					lang: locales[parsed.locale],
				});
			}
		}
		if (links.length <= 1) {
			return void 0;
		}
		i18nPathToLinksCache.set(i18nUrl.path, links);
		return links;
	};
}
export { generateSitemap };
