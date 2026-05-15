import * as z from 'zod/v4';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import colors from 'piccolore';
import { rssSchema } from './schema.js';
import { createCanonicalURL, isValidURL } from './util.js';
const globResultValidator = z.record(
	z.string(),
	z.function({ input: [], output: z.promise(z.any()) }),
);
const rssOptionsValidator = z.object({
	title: z.string(),
	description: z.string(),
	site: z.preprocess((url) => (url instanceof URL ? url.href : url), z.string().url()),
	items: z
		.array(rssSchema)
		.or(globResultValidator)
		.transform((items) => {
			if (!Array.isArray(items)) {
				console.warn(
					colors.yellow(
						'[RSS] Passing a glob result directly has been deprecated. Please migrate to the `pagesGlobToRssItems()` helper: https://docs.astro.build/en/recipes/rss/',
					),
				);
				return pagesGlobToRssItems(items);
			}
			return items;
		}),
	xmlns: z.record(z.string(), z.unknown()).optional(),
	stylesheet: z.union([z.string(), z.boolean()]).optional(),
	customData: z.string().optional(),
	trailingSlash: z.boolean().default(true),
});
async function getRssResponse(rssOptions) {
	const rssString = await getRssString(rssOptions);
	return new Response(rssString, {
		headers: {
			'Content-Type': 'application/xml',
		},
	});
}
async function getRssString(rssOptions) {
	const validatedRssOptions = await validateRssOptions(rssOptions);
	return await generateRSS(validatedRssOptions);
}
async function validateRssOptions(rssOptions) {
	const parsedResult = await rssOptionsValidator.safeParseAsync(rssOptions);
	if (parsedResult.success) {
		return parsedResult.data;
	}
	const formattedError = new Error(
		[
			`[RSS] Invalid or missing options:`,
			...parsedResult.error.issues.map((zodError) => {
				const path = zodError.path.join('.');
				const message = `${zodError.message} (${path})`;
				const code = zodError.code;
				if (path === 'items' && code === 'invalid_union') {
					return [
						message,
						`The \`items\` property requires at least the \`title\` or \`description\` key. They must be properly typed, as well as \`pubDate\` and \`link\` keys if provided.`,
						`Check your collection's schema, and visit https://docs.astro.build/en/recipes/rss/#generating-items for more info.`,
					].join('\n');
				}
				return message;
			}),
		].join('\n'),
	);
	throw formattedError;
}
function pagesGlobToRssItems(items) {
	return Promise.all(
		Object.entries(items).map(async ([filePath, getInfo]) => {
			const { url, frontmatter } = await getInfo();
			if (url === void 0 || url === null) {
				throw new Error(
					`[RSS] You can only glob entries within 'src/pages/' when passing import.meta.glob() directly. Consider mapping the result to an array of RSSFeedItems. See the RSS docs for usage examples: https://docs.astro.build/en/recipes/rss/`,
				);
			}
			const parsedResult = rssSchema
				.refine((val) => val.title || val.description, {
					message: 'At least title or description must be provided.',
					path: ['title', 'description'],
				})
				.safeParse({ ...frontmatter, link: url });
			if (parsedResult.success) {
				return parsedResult.data;
			}
			const formattedError = new Error(
				[
					`[RSS] ${filePath} has invalid or missing frontmatter.
Fix the following properties:`,
					...parsedResult.error.issues.map((zodError) => zodError.message),
				].join('\n'),
			);
			formattedError.file = filePath;
			throw formattedError;
		}),
	);
}
async function generateRSS(rssOptions) {
	const { items, site } = rssOptions;
	const xmlOptions = {
		ignoreAttributes: false,
		// Avoid correcting self-closing tags to standard tags
		// when using `customData`
		// https://github.com/withastro/astro/issues/5794
		suppressEmptyNode: true,
		suppressBooleanAttributes: false,
	};
	const parser = new XMLParser(xmlOptions);
	const root = { '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' } };
	if (typeof rssOptions.stylesheet === 'string') {
		const isXSL = /\.xslt?$/i.test(rssOptions.stylesheet);
		root['?xml-stylesheet'] = {
			'@_href': rssOptions.stylesheet,
			...(isXSL && { '@_type': 'text/xsl' }),
		};
	}
	root.rss = { '@_version': '2.0' };
	if (items.find((result) => result.content)) {
		const XMLContentNamespace = 'http://purl.org/rss/1.0/modules/content/';
		root.rss['@_xmlns:content'] = XMLContentNamespace;
		if (rssOptions.xmlns?.content && rssOptions.xmlns.content === XMLContentNamespace) {
			delete rssOptions.xmlns.content;
		}
	}
	if (rssOptions.xmlns) {
		for (const [k, v] of Object.entries(rssOptions.xmlns)) {
			root.rss[`@_xmlns:${k}`] = v;
		}
	}
	root.rss.channel = {
		title: rssOptions.title,
		description: rssOptions.description,
		link: createCanonicalURL(site, rssOptions.trailingSlash, void 0),
	};
	if (typeof rssOptions.customData === 'string')
		Object.assign(
			root.rss.channel,
			parser.parse(`<channel>${rssOptions.customData}</channel>`).channel,
		);
	root.rss.channel.item = items.map((result) => {
		const item = {};
		if (result.title) {
			item.title = result.title;
		}
		if (typeof result.link === 'string') {
			const itemLink = isValidURL(result.link)
				? result.link
				: createCanonicalURL(result.link, rssOptions.trailingSlash, site);
			item.link = itemLink;
			item.guid = { '#text': itemLink, '@_isPermaLink': 'true' };
		}
		if (result.description) {
			item.description = result.description;
		}
		if (result.pubDate) {
			item.pubDate = result.pubDate.toUTCString();
		}
		if (typeof result.content === 'string') {
			item['content:encoded'] = result.content;
		}
		if (typeof result.customData === 'string') {
			Object.assign(item, parser.parse(`<item>${result.customData}</item>`).item);
		}
		if (Array.isArray(result.categories)) {
			item.category = result.categories;
		}
		if (typeof result.author === 'string') {
			item.author = result.author;
		}
		if (typeof result.commentsUrl === 'string') {
			item.comments = isValidURL(result.commentsUrl)
				? result.commentsUrl
				: createCanonicalURL(result.commentsUrl, rssOptions.trailingSlash, site);
		}
		if (result.source) {
			item.source = parser.parse(
				`<source url="${result.source.url}">${result.source.title}</source>`,
			).source;
		}
		if (result.enclosure) {
			const enclosureURL = isValidURL(result.enclosure.url)
				? result.enclosure.url
				: createCanonicalURL(result.enclosure.url, rssOptions.trailingSlash, site);
			item.enclosure = parser.parse(
				`<enclosure url="${enclosureURL}" length="${result.enclosure.length}" type="${result.enclosure.type}"/>`,
			).enclosure;
		}
		return item;
	});
	return new XMLBuilder(xmlOptions).build(root);
}
export { getRssResponse as default, getRssString, pagesGlobToRssItems, rssSchema };
