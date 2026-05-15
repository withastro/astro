import type { AstroIntegration } from 'astro';
import type { EnumChangefreq, LinkItem as LinkItemBase, SitemapItemLoose } from 'sitemap';
export { EnumChangefreq as ChangeFreqEnum } from 'sitemap';
export type ChangeFreq = `${EnumChangefreq}`;
export type SitemapItem = Pick<
	SitemapItemLoose,
	'url' | 'lastmod' | 'changefreq' | 'priority' | 'links'
>;
export type LinkItem = LinkItemBase;
export type SitemapOptions =
	| {
			filenameBase?: string;
			filter?(page: string): boolean;
			customSitemaps?: string[];
			customPages?: string[];
			i18n?: {
				defaultLocale: string;
				locales: Record<string, string>;
			};
			entryLimit?: number;
			changefreq?: ChangeFreq;
			lastmod?: Date;
			priority?: number;
			serialize?(item: SitemapItem): SitemapItem | Promise<SitemapItem | undefined> | undefined;
			xslURL?: string;
			chunks?: Record<
				string,
				(item: SitemapItem) => SitemapItem | Promise<SitemapItem | undefined> | undefined
			>;
			namespaces?: {
				news?: boolean;
				xhtml?: boolean;
				image?: boolean;
				video?: boolean;
			};
	  }
	| undefined;
declare const createPlugin: (options?: SitemapOptions) => AstroIntegration;
export default createPlugin;
