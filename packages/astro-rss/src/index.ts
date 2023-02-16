import { z } from 'astro/zod';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { yellow } from 'kleur/colors';
import { rssSchema } from './schema.js';
import { createCanonicalURL, errorMap, isValidURL } from './util.js';

export { rssSchema };

export type RSSOptions = {
	/** Title of the RSS Feed */
	title: z.infer<typeof rssOptionsValidator>['title'];
	/** Description of the RSS Feed */
	description: z.infer<typeof rssOptionsValidator>['description'];
	/**
	 * Specify the base URL to use for RSS feed links.
	 * We recommend using the [endpoint context object](https://docs.astro.build/en/reference/api-reference/#contextsite),
	 * which includes the `site` configured in your project's `astro.config.*`
	 */
	site: z.infer<typeof rssOptionsValidator>['site'];
	/** List of RSS feed items to render. */
	items: RSSFeedItem[] | GlobResult;
	/** Specify arbitrary metadata on opening <xml> tag */
	xmlns?: z.infer<typeof rssOptionsValidator>['xmlns'];
	/**
	 * Specifies a local custom XSL stylesheet. Ex. '/public/custom-feed.xsl'
	 */
	stylesheet?: z.infer<typeof rssOptionsValidator>['stylesheet'];
	/** Specify custom data in opening of file */
	customData?: z.infer<typeof rssOptionsValidator>['customData'];
	/** Whether to include drafts or not */
	drafts?: z.infer<typeof rssOptionsValidator>['drafts'];
};

type RSSFeedItem = {
	/** Link to item */
	link: string;
	/** Full content of the item. Should be valid HTML */
	content?: string;
	/** Title of item */
	title: z.infer<typeof rssSchema>['title'];
	/** Publication date of item */
	pubDate: z.infer<typeof rssSchema>['pubDate'];
	/** Item description */
	description?: z.infer<typeof rssSchema>['description'];
	/** Append some other XML-valid data to this item */
	customData?: z.infer<typeof rssSchema>['customData'];
	/** Whether draft or not */
	draft?: z.infer<typeof rssSchema>['draft'];
};

type ValidatedRSSFeedItem = z.infer<typeof rssFeedItemValidator>;
type ValidatedRSSOptions = z.infer<typeof rssOptionsValidator>;
type GlobResult = z.infer<typeof globResultValidator>;

const rssFeedItemValidator = rssSchema.extend({ link: z.string(), content: z.string().optional() });
const globResultValidator = z.record(z.function().returns(z.promise(z.any())));
const rssOptionsValidator = z.object({
	title: z.string(),
	description: z.string(),
	site: z.preprocess((url) => (url instanceof URL ? url.href : url), z.string().url()),
	items: z
		.array(rssFeedItemValidator)
		.or(globResultValidator)
		.transform((items) => {
			if (!Array.isArray(items)) {
				// eslint-disable-next-line
				console.warn(
					yellow(
						'[RSS] Passing a glob result directly has been deprecated. Please migrate to the `pagesGlobToRssItems()` helper: https://docs.astro.build/en/guides/rss/'
					)
				);
				return pagesGlobToRssItems(items);
			}
			return items;
		}),
	xmlns: z.record(z.string()).optional(),
	drafts: z.boolean().default(false),
	stylesheet: z.union([z.string(), z.boolean()]).optional(),
	customData: z.string().optional(),
});

export default async function getRSS(rssOptions: RSSOptions) {
	const validatedRssOptions = await validateRssOptions(rssOptions);

	return {
		body: await generateRSS(validatedRssOptions),
	};
}

async function validateRssOptions(rssOptions: RSSOptions) {
	const parsedResult = await rssOptionsValidator.safeParseAsync(rssOptions, { errorMap });
	if (parsedResult.success) {
		return parsedResult.data;
	}
	const formattedError = new Error(
		[
			`[RSS] Invalid or missing options:`,
			...parsedResult.error.errors.map(
				(zodError) => `${zodError.message} (${zodError.path.join('.')})`
			),
		].join('\n')
	);
	throw formattedError;
}

export function pagesGlobToRssItems(items: GlobResult): Promise<ValidatedRSSFeedItem[]> {
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
