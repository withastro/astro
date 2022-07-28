import type { AstroConfig, AstroIntegration } from 'astro';
import {
	EnumChangefreq,
	LinkItem as LinkItemBase,
	simpleSitemapAndIndex,
	SitemapItemLoose,
} from 'sitemap';
import { fileURLToPath } from 'url';
import { ZodError } from 'zod';

import { generateSitemap } from './generate-sitemap.js';
import { Logger } from './utils/logger.js';
import { validateOptions } from './validate-options.js';

export type ChangeFreq = EnumChangefreq;
export type SitemapItem = Pick<
	SitemapItemLoose,
	'url' | 'lastmod' | 'changefreq' | 'priority' | 'links'
>;
export type LinkItem = LinkItemBase;

export type SitemapOptions =
	| {
			filter?(page: string): boolean;
			customPages?: string[];

			i18n?: {
				defaultLocale: string;
				locales: Record<string, string>;
			};
			// number of entries per sitemap file
			entryLimit?: number;

			// sitemap specific
			changefreq?: ChangeFreq;
			lastmod?: Date;
			priority?: number;

			// called for each sitemap item just before to save them on disk, sync or async
			serialize?(item: SitemapItem): SitemapItem | Promise<SitemapItem | undefined> | undefined;
	  }
	| undefined;

function formatConfigErrorMessage(err: ZodError) {
	const errorList = err.issues.map((issue) => ` ${issue.path.join('.')}  ${issue.message + '.'}`);
	return errorList.join('\n');
}

const PKG_NAME = '@astrojs/sitemap';
const OUTFILE = 'sitemap-index.xml';

const createPlugin = (options?: SitemapOptions): AstroIntegration => {
	let config: AstroConfig;
	return {
		name: PKG_NAME,

		hooks: {
			'astro:config:done': async ({ config: cfg }) => {
				config = cfg;
			},

			'astro:build:done': async ({ dir, pages }) => {
				const logger = new Logger(PKG_NAME);

				try {
					const opts = validateOptions(config.site, options);

					const { filter, customPages, serialize, entryLimit } = opts;

					let finalSiteUrl: URL;
					if (config.site) {
						finalSiteUrl = new URL(config.base, config.site);
					} else {
						// eslint-disable-next-line no-console
						console.warn(
							'The Sitemap integration requires the `site` astro.config option. Skipping.'
						);
						return;
					}

					let pageUrls = pages.map((p) => {
						const path = finalSiteUrl.pathname + p.pathname;
						return new URL(path, finalSiteUrl).href;
					});

					try {
						if (filter) {
							pageUrls = pageUrls.filter(filter);
						}
					} catch (err) {
						logger.error(`Error filtering pages\n${(err as any).toString()}`);
						return;
					}

					if (customPages) {
						pageUrls = [...pageUrls, ...customPages];
					}

					if (pageUrls.length === 0) {
						// offer suggestion for SSR users
						if (config.output !== 'static') {
							logger.warn(
								`No pages found! We can only detect sitemap routes for "static" builds. Since you are using an SSR adapter, we recommend manually listing your sitemap routes using the "customPages" integration option.\n\nExample: \`sitemap({ customPages: ['https://example.com/route'] })\``
							);
						} else {
							logger.warn(`No pages found!\n\`${OUTFILE}\` not created.`);
						}
						return;
					}

					let urlData = generateSitemap(pageUrls, finalSiteUrl.href, opts);

					if (serialize) {
						try {
							const serializedUrls: SitemapItem[] = [];
							for (const item of urlData) {
								const serialized = await Promise.resolve(serialize(item));
								if (serialized) {
									serializedUrls.push(serialized);
								}
							}
							if (serializedUrls.length === 0) {
								logger.warn('No pages found!');
								return;
							}
							urlData = serializedUrls;
						} catch (err) {
							logger.error(`Error serializing pages\n${(err as any).toString()}`);
							return;
						}
					}

					await simpleSitemapAndIndex({
						hostname: finalSiteUrl.href,
						destinationDir: fileURLToPath(dir),
						sourceData: urlData,
						limit: entryLimit,
						gzip: false,
					});
					logger.success(`\`${OUTFILE}\` is created.`);
				} catch (err) {
					if (err instanceof ZodError) {
						logger.warn(formatConfigErrorMessage(err));
					} else {
						throw err;
					}
				}
			},
		},
	};
};

export default createPlugin;
