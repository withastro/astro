import { type WriteStream, createWriteStream } from 'fs';
import { normalize, resolve } from 'path';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';
import replace from 'stream-replace-string';

import { SitemapAndIndexStream, SitemapStream } from 'sitemap';

import type { AstroConfig } from 'astro';
import type { SitemapItem } from './index.js';

type WriteSitemapConfig = {
	hostname: string;
	sitemapHostname?: string;
	sourceData: SitemapItem[];
	destinationDir: string;
	publicBasePath?: string;
	limit?: number;
};

// adapted from sitemap.js/sitemap-simple
export async function writeSitemap(
	{
		hostname,
		sitemapHostname = hostname,
		sourceData,
		destinationDir,
		limit = 50000,
		publicBasePath = './',
	}: WriteSitemapConfig,
	astroConfig: AstroConfig
) {
	await mkdir(destinationDir, { recursive: true });

	const sitemapAndIndexStream = new SitemapAndIndexStream({
		limit,
		getSitemapStream: (i) => {
			const sitemapStream = new SitemapStream({
				hostname,
			});
			const path = `./sitemap-${i}.xml`;
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

	let src = Readable.from(sourceData);
	const indexPath = resolve(destinationDir, `./sitemap-index.xml`);
	return promisify(pipeline)(src, sitemapAndIndexStream, createWriteStream(indexPath));
}
