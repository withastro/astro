import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { normalize, resolve } from 'node:path';
import { pipeline, Readable } from 'node:stream';
import { promisify } from 'node:util';
import { SitemapAndIndexStream, SitemapIndexStream, SitemapStream } from 'sitemap';
import replace from 'stream-replace-string';
async function writeSitemapChunk(
	{
		filenameBase,
		hostname,
		sitemapHostname = hostname,
		sourceData,
		destinationDir,
		limit = 5e4,
		customSitemaps = [],
		publicBasePath = './',
		xslURL: xslUrl,
		lastmod,
		namespaces = { news: true, xhtml: true, image: true, video: true },
	},
	astroConfig,
) {
	await mkdir(destinationDir, { recursive: true });
	let normalizedPublicBasePath = publicBasePath;
	if (!normalizedPublicBasePath.endsWith('/')) {
		normalizedPublicBasePath += '/';
	}
	const sitemapUrls = [];
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
				let stream;
				if (astroConfig.trailingSlash === 'never' || astroConfig.build.format === 'file') {
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
				sitemapUrls.push({ url, lastmod });
				return [{ url, lastmod }, sitemapStream, stream];
			},
		});
		const dataStream = Readable.from(items);
		await promisify(pipeline)(dataStream, sitemapAndIndexStream);
	}
	const indexStream = new SitemapIndexStream({ xslUrl });
	const indexPath = resolve(destinationDir, `./${filenameBase}-index.xml`);
	const indexWriteStream = createWriteStream(indexPath);
	for (const url of customSitemaps) {
		indexStream.write({ url, lastmod });
	}
	for (const sitemapUrl of sitemapUrls) {
		indexStream.write(sitemapUrl);
	}
	indexStream.end();
	return await promisify(pipeline)(indexStream, indexWriteStream);
}
export { writeSitemapChunk };
