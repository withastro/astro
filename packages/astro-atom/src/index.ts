import { z } from 'astro/zod';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { atomSchema } from './schema.js';
import { createCanonicalURL, errorMap, isValidURL } from './util.js';

// TODO: What is left that does not have a TODO:
// - More validation for Atom Feed particularly
// - Tests

export { atomSchema };

export type AtomOptions = {
	/** Title of the Atom Feed */
	title: z.infer<typeof atomOptionsValidator>['title'];
	/** Description or subtitle of the Atom Feed */
	subtitle: z.infer<typeof atomOptionsValidator>['subtitle'];
	/**
	 * Link to site. Formally speaking, the URL to an alternate version of the Atom Feed.
	 * We recommend using the [endpoint context object](https://docs.astro.build/en/reference/api-reference/#contextsite),
	 * which includes the `site` configured in your project's `astro.config.*`
	 */
	site: z.infer<typeof atomOptionsValidator>['site'] | URL;
	/** List of Atom feed entries to render. */
	entries: AtomFeedEntry[];
	/** Specify arbitrary metadata on opening <xml> tag */
	xmlns?: z.infer<typeof atomOptionsValidator>['xmlns'];
	/** Specifies a local custom XSL stylesheet. Ex. '/public/custom-feed.xsl' */
	stylesheet?: z.infer<typeof atomOptionsValidator>['stylesheet'];
	/** Specify custom data in opening of file */
	customData?: z.infer<typeof atomOptionsValidator>['customData'];
	trailingSlash?: z.infer<typeof atomOptionsValidator>['trailingSlash'];
};

export type AtomFeedEntry = {
	/**
	 * Link to entry.
	 * Formally speaking, the URL to an alternate version of the entry.
	 */
	link: z.infer<typeof atomSchema>['link'];
	/** Full content of the item. Should be valid HTML */
	content?: z.infer<typeof atomSchema>['content'];
	/** Title of item */
	title: z.infer<typeof atomSchema>['title'];
	/**
	 * The most recent date when the entry is modified in a way the publisher considers significant.
	 * Not all modifications necessarily result in a change of the field.
	 */
	updated: z.infer<typeof atomSchema>['updated'];
	/** Initial creation or first availability date of entry */
	published: z.infer<typeof atomSchema>['published'];
	/** Short summary, abstract, or excerpt of the entry */
	summary?: z.infer<typeof atomSchema>['summary'];
	/** Append some other XML-valid data to this entry */
	customData?: z.infer<typeof atomSchema>['customData'];
	/** Categories associated with the entry */
	categories?: z.infer<typeof atomSchema>['categories'];
	/** The entry author */
	author?: z.infer<typeof atomSchema>['author'];
	/** The Atom channel that the entry came from */
	source?: z.infer<typeof atomSchema>['source'];
	/** A media object that belongs to the entry */
	enclosure?: z.infer<typeof atomSchema>['enclosure'];
};

type ValidatedAtomFeedItem = z.infer<typeof atomSchema>;
type ValidatedAtomOptions = z.infer<typeof atomOptionsValidator>;
type GlobResult = z.infer<typeof globResultValidator>;

const globResultValidator = z.record(z.function().returns(z.promise(z.any())));

const atomOptionsValidator = z.object({
	title: z.string(),
	subtitle: z.string().optional(),
	site: z.preprocess((url) => (url instanceof URL ? url.href : url), z.string().url()),
	entries: z.array(atomSchema).transform((items) => {
		return items;
	}),
	xmlns: z.record(z.string()).optional(),
	stylesheet: z.union([z.string(), z.boolean()]).optional(),
	customData: z.string().optional(),
	trailingSlash: z.boolean().default(true),
});

export default async function getAtomResponse(atomOptions: AtomOptions): Promise<Response> {
	const atomString = await getAtomString(atomOptions);
	return new Response(atomString, {
		headers: {
			// The RFC gives `application/atom+xml`, but no MAY, SHOULD, or MUST are used.
			// We use this value like @astrojs/rss
			'Content-Type': 'application/xml',
		},
	});
}

export async function getAtomString(atomOptions: AtomOptions): Promise<string> {
	const validatedRssOptions = await validateAtomOptions(atomOptions);
	return await generateAtom(validatedRssOptions);
}

async function validateAtomOptions(atomOptions: AtomOptions) {
	const parsedResult = await atomOptionsValidator.safeParseAsync(atomOptions, { errorMap });
	if (parsedResult.success) {
		return parsedResult.data;
	}
	const formattedError = new Error(
		[
			`[Atom] Invalid or missing options:`,
			...parsedResult.error.errors.map((zodError) => {
				const path = zodError.path.join('.');
				const message = `${zodError.message} (${path})`;
				const code = zodError.code;

				if (path === 'items' && code === 'invalid_union') {
					return [
						message,
						`The \`entris\` property requires at least the \`summary\` or \`content\` key, and at least \`link\` or \`content\` key. They must be properly typed, as well as \`published\` and \`updated\` keys if provided.`,
						`Check your collection's schema, and visit similar https://docs.astro.build/en/guides/rss/#generating-items for more info.`,
					].join('\n');
				}

				return message;
			}),
		].join('\n')
	);
	throw formattedError;
}

// TODO: Frontmatter transformation helper
export function pagesGlobToAtomItems(
	entries: GlobResult,
	frontmatterTransform: (frontmatter: any) => any
): Promise<ValidatedAtomFeedItem[]> {
	return Promise.all(
		Object.entries(entries).map(async ([filePath, getInfo]) => {
			const { url, frontmatter } = await getInfo();
			if (url === undefined || url === null) {
				throw new Error(
					`[Atom] You can only glob entries within 'src/pages/' when passing import.meta.glob() directly. Consider mapping the result to an array of AtomFeedItems. See the similar RSS docs for usage examples: https://docs.astro.build/en/guides/rss/#2-list-of-rss-feed-objects`
				);
			}
			const parsedResult = atomSchema
				.refine((val) => val.title, {
					message: 'Title must be provided.',
					path: ['title'],
				})
				.refine((val) => val.summary || val.content, {
					message: 'At least summary or content must be provided.',
					path: ['title'],
				})
				.safeParse({ ...frontmatterTransform(frontmatter), link: url }, { errorMap });

			if (parsedResult.success) {
				return parsedResult.data;
			}
			const formattedError = new Error(
				[
					`[Atom] ${filePath} has invalid or missing frontmatter.\nFix the following properties:`,
					...parsedResult.error.errors.map((zodError) => zodError.message),
				].join('\n')
			);
			(formattedError as any).file = filePath;
			throw formattedError;
		})
	);
}

/** Generate Atom 1.0 (RFC 4287) feed */
async function generateAtom(atomOptions: ValidatedAtomOptions): Promise<string> {
	const { entries, site } = atomOptions;

	const xmlOptions = {
		ignoreAttributes: false,
		// Avoid correcting self-closing tags to standard tags
		// when using `customData`
		// https://github.com/withastro/astro/issues/5794
		suppressEmptyNode: true,
		suppressBooleanAttributes: false,
	};
	const parser = new XMLParser(xmlOptions);
	const root: any = { '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' } };
	if (typeof atomOptions.stylesheet === 'string') {
		const isXSL = /\.xsl$/i.test(atomOptions.stylesheet);
		root['?xml-stylesheet'] = {
			'@_href': atomOptions.stylesheet,
			...(isXSL && { '@_type': 'text/xsl' }),
		};
	}

	// xmlns
	const XMLNamespace = 'http://www.w3.org/2005/Atom';
	root.feed = { '@_xmlns': XMLNamespace };
	if (atomOptions.xmlns) {
		for (const [k, v] of Object.entries(atomOptions.xmlns)) {
			root.feed[`@_xmlns:${k}`] = v;
		}
	}

	// title, description, customData
	root.feed.title = atomOptions.title;
	root.feed.subtitle = atomOptions.subtitle;
	root.feed.link = {
		'@_href': createCanonicalURL(site, atomOptions.trailingSlash, undefined).href,
	};
	if (typeof atomOptions.customData === 'string')
		Object.assign(root.feed, parser.parse(`<feed>${atomOptions.customData}</feed>`).feed);
	// entris
	root.feed.entry = entries.map((result) => {
		const entry: Record<string, unknown> & { link: any[] } = { link: [] };

		if (result.title) {
			entry.title = result.title;
		}
		if (typeof result.link === 'string') {
			// If the item's link is already a valid URL, don't mess with it.
			const itemLink = isValidURL(result.link)
				? result.link
				: createCanonicalURL(result.link, atomOptions.trailingSlash, site).href;
			entry.link.push({ '@_href': itemLink });
			entry.id = itemLink;
		}
		if (result.summary) {
			entry.summary = result.summary;
		}
		if (result.updated) {
			entry.updated = result.updated.toUTCString();
		}
		if (result.published) {
			entry.published = result.published.toUTCString();
		}
		// include the full content of the post if the user supplies it
		if (typeof result.content === 'string') {
			// TODO: Other types, e.g., XHTML
			entry.content = { '@_type': 'html', '#text': result.content };
		}
		if (typeof result.customData === 'string') {
			Object.assign(entry, parser.parse(`<entry>${result.customData}</entry>`).entry);
		}
		if (Array.isArray(result.categories)) {
			// TODO: Category objects
			entry.category = result.categories.map((category) => ({ '@_term': category }));
		}
		if (typeof result.author === 'object') {
			entry.author = result.author;
		}
		if (result.source) {
			// TODO: Source object
			entry.source = { title: result.source.title, link: { '@_href': result.source.url } };
		}
		if (result.enclosure) {
			const enclosureURL = isValidURL(result.enclosure.url)
				? result.enclosure.url
				: createCanonicalURL(result.enclosure.url, atomOptions.trailingSlash, site).href;
			entry.link.push(
				parser.parse(
					`<link rel="enclosure" href="${enclosureURL}" length="${result.enclosure.length}" type="${result.enclosure.type}"/>`
				).link
			);
		}
		return entry;
	});

	return new XMLBuilder(xmlOptions).build(root);
}
