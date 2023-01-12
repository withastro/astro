import { z } from 'astro/zod';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { rssSchema } from './schema.js';
import { createCanonicalURL, errorMap, isValidURL } from './util.js';

export { rssSchema };

export type RSSOptions = {
	/** (required) Title of the RSS Feed */
	title: RSSOptionsSchema['title'];
	/** (required) Description of the RSS Feed */
	description: RSSOptionsSchema['description'];
	/**
	 * Specify the base URL to use for RSS feed links.
	 * We recommend "import.meta.env.SITE" to pull in the "site"
	 * from your project's astro.config.
	 */
	site: RSSOptionsSchema['site'];
	/** List of RSS feed items to render. */
	items: RSSFeedItem[];
	/** Specify arbitrary metadata on opening <xml> tag */
	xmlns?: RSSOptionsSchema['xmlns'];
	/**
	 * Specifies a local custom XSL stylesheet. Ex. '/public/custom-feed.xsl'
	 */
	stylesheet?: RSSOptionsSchema['stylesheet'];
	/** Specify custom data in opening of file */
	customData?: RSSOptionsSchema['customData'];
	/** Whether to include drafts or not */
	drafts?: RSSOptionsSchema['drafts'];
};
type RSSOptionsSchema = z.infer<typeof rssOptionsValidator>;

type RSSFeedItem = {
	/** Link to item */
	link: string;
	/** Full content of the item. Should be valid HTML */
	content?: string;
	/** Title of item */
	title: z.infer<typeof rssSchema>['title'];
	/** Publication date of item */
	pubDate: string;
	/** Item description */
	description?: z.infer<typeof rssSchema>['description'];
	/** Append some other XML-valid data to this item */
	customData?: z.infer<typeof rssSchema>['customData'];
	/** Whether draft or not */
	draft?: z.infer<typeof rssSchema>['draft'];
};

type ValidatedRSSFeedItem = z.infer<typeof rssFeedItemValidator>;
type ValidatedRSSOptions = z.infer<typeof rssOptionsValidator>;

const rssFeedItemValidator = rssSchema.extend({ link: z.string(), content: z.string().optional() });
const rssOptionsValidator = z.object({
	title: z.string(),
	description: z.string(),
	site: z.string(),
	items: z.array(rssFeedItemValidator),
	xmlns: z.record(z.string()).optional(),
	drafts: z.boolean().default(false),
	stylesheet: z.union([z.string(), z.boolean()]).optional(),
	customData: z.string().optional(),
});

function validateRssOptions(rssOptions: RSSOptions) {
	const parsedResult = rssOptionsValidator.safeParse(rssOptions, { errorMap });
	if (parsedResult.success) {
		return parsedResult.data;
	}
	const formattedError = new Error(
		[
			`[RSS] Invalid or missing options:`,
			...parsedResult.error.errors.map((zodError) => zodError.message),
		].join('\n')
	);
	throw formattedError;
}

type GlobResult = Record<string, () => Promise<{ [key: string]: any }>>;

export function globToRssItems(items: GlobResult): Promise<ValidatedRSSFeedItem[]> {
	return Promise.all(
		Object.entries(items).map(async ([filePath, getInfo]) => {
			const { url, frontmatter } = await getInfo();
			if (url === undefined || url === null) {
				throw new Error(
					`[RSS] You can only glob entries within 'src/pages/' when passing import.meta.glob() directly. Consider mapping the result to an array of RSSFeedItems. See the RSS docs for usage examples: https://docs.astro.build/en/guides/rss/#2-list-of-rss-feed-objects`
				);
			}
			const parsedResult = rssFeedItemValidator.safeParse(
				{ ...frontmatter, link: url },
				{ errorMap }
			);

			if (parsedResult.success) {
				return parsedResult.data;
			}
			const formattedError = new Error(
				[
					`[RSS] ${filePath} has invalid or missing frontmatter.\nFix the following properties:`,
					...parsedResult.error.errors.map((zodError) => zodError.message),
				].join('\n')
			);
			(formattedError as any).file = filePath;
			throw formattedError;
		})
	);
}

export default async function getRSS(rssOptions: RSSOptions) {
	const validatedRssOptions = validateRssOptions(rssOptions);

	return {
		body: await generateRSS(validatedRssOptions),
	};
}

/** Generate RSS 2.0 feed */
async function generateRSS(rssOptions: ValidatedRSSOptions): Promise<string> {
	const { site } = rssOptions;
	const items = rssOptions.drafts
		? rssOptions.items
		: rssOptions.items.filter((item) => !item.draft);

	const xmlOptions = { ignoreAttributes: false };
	const parser = new XMLParser(xmlOptions);
	const root: any = { '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' } };
	if (typeof rssOptions.stylesheet === 'string') {
		const isXSL = /\.xsl$/i.test(rssOptions.stylesheet);
		root['?xml-stylesheet'] = {
			'@_href': rssOptions.stylesheet,
			...(isXSL && { '@_type': 'text/xsl' }),
		};
	}
	root.rss = { '@_version': '2.0' };
	if (items.find((result) => result.content)) {
		// the namespace to be added to the xmlns:content attribute to enable the <content> RSS feature
		const XMLContentNamespace = 'http://purl.org/rss/1.0/modules/content/';
		root.rss['@_xmlns:content'] = XMLContentNamespace;
		// Ensure that the user hasn't tried to manually include the necessary namespace themselves
		if (rssOptions.xmlns?.content && rssOptions.xmlns.content === XMLContentNamespace) {
			delete rssOptions.xmlns.content;
		}
	}

	// xmlns
	if (rssOptions.xmlns) {
		for (const [k, v] of Object.entries(rssOptions.xmlns)) {
			root.rss[`@_xmlns:${k}`] = v;
		}
	}

	// title, description, customData
	root.rss.channel = {
		title: rssOptions.title,
		description: rssOptions.description,
		link: createCanonicalURL(site).href,
	};
	if (typeof rssOptions.customData === 'string')
		Object.assign(
			root.rss.channel,
			parser.parse(`<channel>${rssOptions.customData}</channel>`).channel
		);
	// items
	root.rss.channel.item = items.map((result) => {
		// If the item's link is already a valid URL, don't mess with it.
		const itemLink = isValidURL(result.link)
			? result.link
			: createCanonicalURL(result.link, site).href;
		const item: any = {
			title: result.title,
			link: itemLink,
			guid: itemLink,
		};
		if (result.description) {
			item.description = result.description;
		}
		if (result.pubDate) {
			item.pubDate = result.pubDate.toUTCString();
		}
		// include the full content of the post if the user supplies it
		if (typeof result.content === 'string') {
			item['content:encoded'] = result.content;
		}
		if (typeof result.customData === 'string') {
			Object.assign(item, parser.parse(`<item>${result.customData}</item>`).item);
		}
		return item;
	});

	return new XMLBuilder(xmlOptions).build(root);
}
