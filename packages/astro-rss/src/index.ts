import { XMLValidator } from 'fast-xml-parser';
import { createCanonicalURL, isValidURL } from './util.js';

type GlobResult = Record<string, () => Promise<{ [key: string]: any }>>;

type RSSOptions = {
	/** (required) Title of the RSS Feed */
	title: string;
	/** (required) Description of the RSS Feed */
	description: string;
	/**
	 * List of RSS feed items to render. Accepts either:
	 * a) list of RSSFeedItems
	 * b) import.meta.glob result. You can only glob ".md" files within src/pages/ when using this method!
	 */
	items: RSSFeedItem[] | GlobResult;
	/** Specify arbitrary metadata on opening <xml> tag */
	xmlns?: Record<string, string>;
	/**
	 * Specifies a local custom XSL stylesheet. Ex. '/public/custom-feed.xsl'
	 */
	stylesheet?: string | boolean;
	/** Specify custom data in opening of file */
	customData?: string;
	/**
	 * Specify the base URL to use for RSS feed links.
	 * Defaults to "site" in your project's astro.config
	 */
	canonicalUrl?: string;
};

type RSSFeedItem = {
	/** Link to item */
	link: string;
	/** Title of item */
	title: string;
	/** Publication date of item */
	pubDate: Date;
	/** Item description */
	description?: string;
	/** Append some other XML-valid data to this item */
	customData?: string;
};

type GenerateRSSArgs = {
	site: string;
	rssOptions: RSSOptions;
	items: RSSFeedItem[];
};

function isGlobResult(items: RSSOptions['items']): items is GlobResult {
	return typeof items === 'object' && !items.length;
}

function mapGlobResult(items: GlobResult): Promise<RSSFeedItem[]> {
	return Promise.all(
		Object.values(items).map(async (getInfo) => {
			const { url, frontmatter } = await getInfo();
			if (!Boolean(url)) {
				throw new Error(
					`[RSS] When passing an import.meta.glob result directly, you can only glob ".md" files within /pages! Consider mapping the result to an array of RSSFeedItems. See the RSS docs for usage examples: https://docs.astro.build/en/guides/rss/#2-list-of-rss-feed-objects`
				);
			}
			if (!Boolean(frontmatter.title) || !Boolean(frontmatter.pubDate)) {
				throw new Error(`[RSS] "${url}" is missing a "title" and/or "pubDate" in its frontmatter.`);
			}
			return {
				link: url,
				title: frontmatter.title,
				pubDate: frontmatter.pubDate,
				description: frontmatter.description,
				customData: frontmatter.customData,
			};
		})
	);
}

export default async function getRSS(rssOptions: RSSOptions) {
	const site = rssOptions.canonicalUrl ?? (import.meta as any).env.SITE;
	if (!site) {
		throw new Error(
			`RSS requires a canonical URL. Either add a "site" to your project's astro.config, or supply the canonicalUrl argument.`
		);
	}
	let { items } = rssOptions;
	if (isGlobResult(items)) {
		items = await mapGlobResult(items);
	}
	return {
		body: await generateRSS({
			site,
			rssOptions,
			items,
		}),
	};
}

/** Generate RSS 2.0 feed */
export async function generateRSS({ site, rssOptions, items }: GenerateRSSArgs): Promise<string> {
	let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
	if (typeof rssOptions.stylesheet === 'string') {
		xml += `<?xml-stylesheet href="${rssOptions.stylesheet}" type="text/xsl"?>`;
	}
	xml += `<rss version="2.0"`;

	// xmlns
	if (rssOptions.xmlns) {
		for (const [k, v] of Object.entries(rssOptions.xmlns)) {
			xml += ` xmlns:${k}="${v}"`;
		}
	}
	xml += `>`;
	xml += `<channel>`;

	// title, description, customData
	xml += `<title><![CDATA[${rssOptions.title}]]></title>`;
	xml += `<description><![CDATA[${rssOptions.description}]]></description>`;
	xml += `<link>${createCanonicalURL(site).href}</link>`;
	if (typeof rssOptions.customData === 'string') xml += rssOptions.customData;
	// items
	for (const result of items) {
		xml += `<item>`;
		xml += `<title><![CDATA[${result.title}]]></title>`;
		// If the item's link is already a valid URL, don't mess with it.
		const itemLink = isValidURL(result.link)
			? result.link
			: createCanonicalURL(result.link, site).href;
		xml += `<link>${itemLink}</link>`;
		xml += `<guid>${itemLink}</guid>`;
		if (result.description) xml += `<description><![CDATA[${result.description}]]></description>`;
		if (result.pubDate) {
			// note: this should be a Date, but if user provided a string or number, we can work with that, too.
			if (typeof result.pubDate === 'number' || typeof result.pubDate === 'string') {
				result.pubDate = new Date(result.pubDate);
			} else if (result.pubDate instanceof Date === false) {
				throw new Error('[${filename}] rss.item().pubDate must be a Date');
			}
			xml += `<pubDate>${result.pubDate.toUTCString()}</pubDate>`;
		}
		if (typeof result.customData === 'string') xml += result.customData;
		xml += `</item>`;
	}

	xml += `</channel></rss>`;

	// validate user’s inputs to see if it’s valid XML
	const isValid = XMLValidator.validate(xml);
	if (isValid !== true) {
		// If valid XML, isValid will be `true`. Otherwise, this will be an error object. Throw.
		throw new Error(isValid as any);
	}

	return xml;
}
