import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { normalize, resolve } from 'node:path';
import { pipeline, Readable } from 'node:stream';
import { promisify } from 'node:util';
import { SitemapAndIndexStream, SitemapIndexStream, SitemapStream } from 'sitemap';
import type { SitemapItem } from './index.js';
import { getLatestLastmod } from './utils/lastmod.js';

type WriteSitemapChunkConfig = {
	filenameBase: string;
	hostname: string;
	sitemapHostname?: string;
	sourceData: Record<string, SitemapItem[]>;
	destinationDir: string;
	customSitemaps?: string[];
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
export async function writeSitemapChunk({
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
}: WriteSitemapChunkConfig) {
	await mkdir(destinationDir, { recursive: true });

	// Normalize publicBasePath
	let normalizedPublicBasePath = publicBasePath;
	if (!normalizedPublicBasePath.endsWith('/')) {
		normalizedPublicBasePath += '/';
	}

	// Array to collect all sitemap URLs for the index
	const sitemapUrls: Array<{ url: string; lastmod?: string }> = [];

	// Process each chunk separately
	for (const [chunkName, items] of Object.entries(sourceData)) {
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

				const path = `./${filenameBase}-${chunkName}-${i}.xml`;
				const writePath = resolve(destinationDir, path);
				const publicPath = normalize(normalizedPublicBasePath + path);

				const stream = sitemapStream.pipe(createWriteStream(writePath));

				const url = new URL(publicPath, sitemapHostname).toString();
				// Stamp this index entry with the freshest lastmod among the
				// URLs that land in this file (items are written in order,
				// `limit` per file), falling back to the global `lastmod`.
				const fileLastmod = getLatestLastmod(items.slice(i * limit, (i + 1) * limit)) ?? lastmod;

				// Collect this sitemap URL for the index
				sitemapUrls.push({ url, lastmod: fileLastmod });

				return [{ url, lastmod: fileLastmod }, sitemapStream, stream];
			},
		});

		// Create a readable stream from this chunk's items
		const dataStream = Readable.from(items);

		// Write this chunk's sitemap(s)
		await promisify(pipeline)(dataStream, sitemapAndIndexStream);
	}

	// Now create the sitemap index with all the generated sitemaps
	const indexStream = new SitemapIndexStream({ xslUrl });
	const indexPath = resolve(destinationDir, `./${filenameBase}-index.xml`);
	const indexWriteStream = createWriteStream(indexPath);

	// Add custom sitemaps to the index
	for (const url of customSitemaps) {
		indexStream.write({ url, lastmod });
	}

	// Add all generated sitemaps to the index
	for (const sitemapUrl of sitemapUrls) {
		indexStream.write(sitemapUrl);
	}

	indexStream.end();

	return await promisify(pipeline)(indexStream, indexWriteStream);
}
