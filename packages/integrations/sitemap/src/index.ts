import type { AstroConfig, AstroIntegration } from 'astro';
import {
	EnumChangefreq,
	simpleSitemapAndIndex,
	type LinkItem as LinkItemBase,
	type SitemapItemLoose,
} from 'sitemap';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';
import { ZodError } from 'zod';

import { generateSitemap } from './generate-sitemap.js';
import { Logger } from './utils/logger.js';
import { isRoutePrerendered } from './utils/is-route-prerendered.js';
import { validateOptions } from './validate-options.js';

export type ChangeFreq = `${EnumChangefreq}`;
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
	const logger = new Logger(PKG_NAME);

	return {
		name: PKG_NAME,

		hooks: {
			'astro:config:done': async ({ config: cfg }) => {
				if (cfg.site) {
					config = cfg;
				} else {
					// eslint-disable-next-line no-console
					console.warn(
						'The Sitemap integration requires the `site` astro.config option. Skipping.'
					);
					return;
				}
			},

			'astro:build:start': async () => {
				if (config.output !== 'server' || !config.site) {
					return;
				}

				const srcPath = fileURLToPath(config.srcDir);
				const pagesPath = resolve(srcPath, 'pages');

				const pageFiles = await fg(`${pagesPath}/**/*.{astro,ts,js}`);

				const routes = (
					await Promise.all(
						pageFiles.map(async (filePath) => {
							const isPrerendered = await isRoutePrerendered(filePath);
							const index = filePath.indexOf('pages/') + 6;
							const routeSegment = filePath
								.substring(index)
								.replace(/\.(astro|ts|js)/, '')
								.replace(/index$/, '');

							/**
							 * @TODO
							 * figure out how to run `getStaticPaths` here.
							 */
							const isDynamicRoute = routeSegment.endsWith(']');
							const shouldIndex = !isDynamicRoute && !isPrerendered;

							return shouldIndex ? `${config.site}/${routeSegment}` : undefined;
						})
					)
				).filter((route): route is string => Boolean(route));
				const opts = validateOptions(config.site, options);

				opts.customPages = opts.customPages
					? Array.from(new Set([...routes, ...opts.customPages]))
					: routes;
				options = opts;

				logger.info(`build is starting + ${JSON.stringify(opts.customPages, null, 2)}`);
			},

			'astro:build:done': async ({ dir, pages }) => {
				try {
					if (!config.site) {
						return;
					}

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
						if (p.pathname !== '' && !finalSiteUrl.pathname.endsWith('/'))
							finalSiteUrl.pathname += '/';
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
						logger.warn(`No pages found!\n\`${OUTFILE}\` not created.`);
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
