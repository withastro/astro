import type { SitemapItem, SitemapOptions } from './index.js';
import { parseUrl } from './utils/parse-url.js';

const STATUS_CODE_PAGE_REGEXP = /\/[0-9]{3}\/?$/;

/** Construct sitemap.xml given a set of URLs */
export function generateSitemap(pages: string[], finalSiteUrl: string, opts: SitemapOptions) {
	const { changefreq, priority, lastmod: lastmodSrc, i18n } = opts!;
	// TODO: find way to respect <link rel="canonical"> URLs here
	const urls = [...pages].filter((url) => !STATUS_CODE_PAGE_REGEXP.test(url));
	urls.sort((a, b) => a.localeCompare(b, 'en', { numeric: true })); // sort alphabetically so sitemap is same each time

	const lastmod = lastmodSrc?.toISOString();

	const { locales, defaultLocale } = i18n || {};
	const localeCodes = Object.keys(locales || {});

	const getPath = (url: string) => {
		const result = parseUrl(url, i18n?.defaultLocale || '', localeCodes, finalSiteUrl);
		return result?.path;
	};
	const getLocale = (url: string) => {
		const result = parseUrl(url, i18n?.defaultLocale || '', localeCodes, finalSiteUrl);
		return result?.locale;
	};

	const urlData: SitemapItem[] = urls.map((url) => {
		let links;
		if (defaultLocale && locales) {
			const currentPath = getPath(url);
			if (currentPath) {
				const filtered = urls.filter((subUrl) => getPath(subUrl) === currentPath);
				if (filtered.length > 1) {
					links = filtered.map((subUrl) => ({
						url: subUrl,
						lang: locales[getLocale(subUrl)!],
					}));
				}
			}
		}

		return {
			url,
			links,
			lastmod,
			priority,
			changefreq,
		};
	});

	return urlData;
}
