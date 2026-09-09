import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { normalize, resolve } from 'node:path';
import { pipeline, Readable } from 'node:stream';
import { promisify } from 'node:util';
import { SitemapAndIndexStream, SitemapIndexStream, SitemapStream } from 'sitemap';
import type { SitemapItem } from './index.js';
import { getLatestLastmod } from './utils/lastmod.js';

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
export async function writeSitemap({
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
}: WriteSitemapConfig) {
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

			const stream = sitemapStream.pipe(createWriteStream(writePath));

			const url = new URL(publicPath, sitemapHostname).toString();
			// Stamp this index entry with the freshest lastmod among the URLs
			// that land in this file (items are written in order, `limit` per
			// file), falling back to the configured global `lastmod`.
			const fileLastmod = getLatestLastmod(sourceData.slice(i * limit, (i + 1) * limit)) ?? lastmod;
			return [{ url, lastmod: fileLastmod }, sitemapStream, stream];
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
