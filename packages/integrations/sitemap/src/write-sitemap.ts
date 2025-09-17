import { createWriteStream, type WriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { normalize, resolve } from 'node:path';
import { pipeline, Readable } from 'node:stream';
import { promisify } from 'node:util';
import type { AstroConfig } from 'astro';
import { SitemapAndIndexStream, SitemapIndexStream, SitemapStream } from 'sitemap';
import replace from 'stream-replace-string';
import type { SitemapItem } from './index.js';

type WriteSitemapConfig = {
	filenameBase: string;
	hostname: string;
	sitemapHostname?: string;
	customSitemaps?: string[];
	sourceData: SitemapItem[];
	destinationDir: string;
	publicBasePath?: string;
	limit?: number;
	xslURL?: string;
	lastmod?: string;
	namespaces?: {
		news?: boolean;
		xhtml?: boolean;
		image?: boolean;
		video?: boolean;
	};
};

// adapted from sitemap.js/sitemap-simple
export async function writeSitemap(
	{
		filenameBase,
		hostname,
		sitemapHostname = hostname,
		sourceData,
		destinationDir,
		limit = 50000,
		customSitemaps = [],
		publicBasePath = './',
		xslURL: xslUrl,
		lastmod,
		namespaces = { news: true, xhtml: true, image: true, video: true },
	}: WriteSitemapConfig,
	astroConfig: AstroConfig,
) {
	await mkdir(destinationDir, { recursive: true });

	const sitemapAndIndexStream = new SitemapAndIndexStream({
		limit,
		xslUrl,
		getSitemapStream: (i) => {
			const sitemapStream = new SitemapStream({
				hostname,
				xslUrl,
				// Custom namespace handling
				xmlns: {
					news: namespaces?.news !== false,
					xhtml: namespaces?.xhtml !== false,
					image: namespaces?.image !== false,
					video: namespaces?.video !== false,
				},
			});
			const path = `./${filenameBase}-${i}.xml`;
			const writePath = resolve(destinationDir, path);
			if (!publicBasePath.endsWith('/')) {
				publicBasePath += '/';
			}
			const publicPath = normalize(publicBasePath + path);

			let stream: WriteStream;
			if (astroConfig.trailingSlash === 'never' || astroConfig.build.format === 'file') {
				// workaround for trailing slash issue in sitemap.js: https://github.com/ekalinin/sitemap.js/issues/403
				const host = hostname.endsWith('/') ? hostname.slice(0, -1) : hostname;
				const searchStr = `<loc>${host}/</loc>`;
				const replaceStr = `<loc>${host}</loc>`;
				stream = sitemapStream
					.pipe(replace(searchStr, replaceStr))
					.pipe(createWriteStream(writePath));
			} else {
				stream = sitemapStream.pipe(createWriteStream(writePath));
			}

			const url = new URL(publicPath, sitemapHostname).toString();
			return [{ url, lastmod }, sitemapStream, stream];
		},
	});

	const src = Readable.from(sourceData);
	const indexPath = resolve(destinationDir, `./${filenameBase}-index.xml`);
	for (const url of customSitemaps) {
		SitemapIndexStream.prototype._transform.call(
			sitemapAndIndexStream,
			{ url, lastmod },
			'utf8',
			() => {},
		);
	}
	return promisify(pipeline)(src, sitemapAndIndexStream, createWriteStream(indexPath));
}
