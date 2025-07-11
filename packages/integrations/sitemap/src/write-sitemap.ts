import { createWriteStream, type WriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { normalize, resolve } from 'node:path';
import { pipeline, Readable } from 'node:stream';
import { promisify } from 'node:util';
import type { AstroConfig } from 'astro';

import { SitemapAndIndexStream, SitemapStream } from 'sitemap';
import replace from 'stream-replace-string';
import type { SitemapItem } from './index.js';

type WriteSitemapConfig = {
	filenameBase: string;
	hostname: string;
	sitemapHostname?: string;
	sourceData: SitemapItem[];
	destinationDir: string;
	publicBasePath?: string;
	limit?: number;
	xslURL?: string;
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
		publicBasePath = './',
		xslURL: xslUrl,
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

			return [new URL(publicPath, sitemapHostname).toString(), sitemapStream, stream];
		},
	});

	const src = Readable.from(sourceData);
	const indexPath = resolve(destinationDir, `./${filenameBase}-index.xml`);
	return promisify(pipeline)(src, sitemapAndIndexStream, createWriteStream(indexPath));
}
