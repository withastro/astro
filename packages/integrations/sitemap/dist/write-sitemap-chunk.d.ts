import type { AstroConfig } from 'astro';
import type { SitemapItem } from './index.js';
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
export declare function writeSitemapChunk(
	{
		filenameBase,
		hostname,
		sitemapHostname,
		sourceData,
		destinationDir,
		limit,
		customSitemaps,
		publicBasePath,
		xslURL: xslUrl,
		lastmod,
		namespaces,
	}: WriteSitemapChunkConfig,
	astroConfig: AstroConfig,
): Promise<void>;
export {};
