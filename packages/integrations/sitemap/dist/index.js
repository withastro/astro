import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod/v4';
import { generateSitemap } from './generate-sitemap.js';
import { validateOptions } from './validate-options.js';
import { writeSitemap } from './write-sitemap.js';
import { writeSitemapChunk } from './write-sitemap-chunk.js';
import { EnumChangefreq } from 'sitemap';
function formatConfigErrorMessage(err) {
	const errorList = err.issues.map((issue) => ` ${issue.path.join('.')}  ${issue.message + '.'}`);
	return errorList.join('\n');
}
const PKG_NAME = '@astrojs/sitemap';
const STATUS_CODE_PAGES = /* @__PURE__ */ new Set(['404', '500']);
const isStatusCodePage = (locales) => {
	const statusPathNames = new Set(
		locales
			.flatMap((locale) => [...STATUS_CODE_PAGES].map((page) => `${locale}/${page}`))
			.concat([...STATUS_CODE_PAGES]),
	);
	return (pathname) => {
		if (pathname.endsWith('/')) {
			pathname = pathname.slice(0, -1);
		}
		if (pathname.startsWith('/')) {
			pathname = pathname.slice(1);
		}
		return statusPathNames.has(pathname);
	};
};
const createPlugin = (options) => {
	let _routes;
	let config;
	return {
		name: PKG_NAME,
		hooks: {
			'astro:routes:resolved': ({ routes }) => {
				_routes = routes;
			},
			'astro:config:done': async ({ config: cfg }) => {
				config = cfg;
			},
			'astro:build:done': async ({ dir, pages, logger }) => {
				try {
					if (!config.site) {
						logger.warn(
							'The Sitemap integration requires the `site` astro.config option. Skipping.',
						);
						return;
					}
					const opts = validateOptions(config.site, options);
					const {
						filenameBase,
						filter,
						customPages,
						customSitemaps,
						serialize,
						entryLimit,
						chunks,
					} = opts;
					const outFile = `${filenameBase}-index.xml`;
					const finalSiteUrl = new URL(config.base, config.site);
					const shouldIgnoreStatus = isStatusCodePage(Object.keys(opts.i18n?.locales ?? {}));
					let pageUrls = pages
						.filter((p) => !shouldIgnoreStatus(p.pathname))
						.map((p) => {
							if (p.pathname !== '' && !finalSiteUrl.pathname.endsWith('/'))
								finalSiteUrl.pathname += '/';
							if (p.pathname.startsWith('/')) p.pathname = p.pathname.slice(1);
							const fullPath = finalSiteUrl.pathname + p.pathname;
							return new URL(fullPath, finalSiteUrl).href;
						});
					const addRouteUrl = (urls, r) => {
						if (r.pathname) {
							if (shouldIgnoreStatus(r.pathname ?? r.pattern)) return;
							let fullPath = finalSiteUrl.pathname;
							if (fullPath.endsWith('/')) fullPath += r.generate(r.pathname).substring(1);
							else fullPath += r.generate(r.pathname);
							const newUrl = new URL(fullPath, finalSiteUrl).href;
							if (config.trailingSlash === 'never') {
								urls.push(newUrl);
							} else if (config.build.format === 'directory' && !newUrl.endsWith('/')) {
								urls.push(newUrl + '/');
							} else {
								urls.push(newUrl);
							}
						}
					};
					const routeUrls = _routes.reduce((urls, r) => {
						if (r.type !== 'page') return urls;
						addRouteUrl(urls, r);
						for (const fallbackRoute of r.fallbackRoutes ?? []) {
							addRouteUrl(urls, fallbackRoute);
						}
						return urls;
					}, []);
					pageUrls = Array.from(
						/* @__PURE__ */ new Set([...pageUrls, ...routeUrls, ...(customPages ?? [])]),
					);
					if (filter) {
						pageUrls = pageUrls.filter((value) => filter(value));
					}
					if (pageUrls.length === 0) {
						logger.warn(`No pages found!
\`${outFile}\` not created.`);
						return;
					}
					let urlData = generateSitemap(pageUrls, finalSiteUrl.href, opts);
					if (serialize) {
						try {
							const serializedUrls = [];
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
							logger.error(`Error serializing pages
${err.toString()}`);
							return;
						}
					}
					const destDir = fileURLToPath(dir);
					const lastmod = opts.lastmod?.toISOString();
					const xslURL = opts.xslURL ? new URL(opts.xslURL, finalSiteUrl).href : void 0;
					if (chunks) {
						try {
							let groupedUrlCollection = [];
							const chunksItem = {};
							for (const [key, cb] of Object.entries(chunks)) {
								const collection = [];
								for (const item of urlData) {
									const collect = await Promise.resolve(cb(item));
									if (collect) {
										collection.push(collect);
									}
								}
								chunksItem[key] = collection;
								groupedUrlCollection = [
									...groupedUrlCollection,
									...collection.map((coll) => coll.url),
								];
							}
							chunksItem['pages'] = urlData.filter(
								(urlDataItem) => !groupedUrlCollection.includes(urlDataItem.url),
							);
							await writeSitemapChunk(
								{
									filenameBase,
									hostname: finalSiteUrl.href,
									sitemapHostname: finalSiteUrl.href,
									sourceData: chunksItem,
									destinationDir: destDir,
									publicBasePath: config.base,
									customSitemaps,
									limit: entryLimit,
									xslURL,
									lastmod,
									namespaces: opts.namespaces,
								},
								config,
							);
							logger.info(`\`${outFile}\` created at \`${path.relative(process.cwd(), destDir)}\``);
							return;
						} catch (err) {
							logger.error(`Error chunking sitemaps
${err.toString()}`);
							return;
						}
					}
					await writeSitemap(
						{
							filenameBase,
							hostname: finalSiteUrl.href,
							destinationDir: destDir,
							publicBasePath: config.base,
							sourceData: urlData,
							limit: entryLimit,
							customSitemaps,
							xslURL,
							lastmod,
							namespaces: opts.namespaces,
						},
						config,
					);
					logger.info(`\`${outFile}\` created at \`${path.relative(process.cwd(), destDir)}\``);
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
var index_default = createPlugin;
export { EnumChangefreq as ChangeFreqEnum, index_default as default };
