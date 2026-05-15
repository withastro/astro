import * as z from 'zod/v4';
import { rssSchema } from './schema.js';
export { rssSchema };
export type RSSOptions = {
	/** Title of the RSS Feed */
	title: z.infer<typeof rssOptionsValidator>['title'];
	/** Description of the RSS Feed */
	description: z.infer<typeof rssOptionsValidator>['description'];
	/**
	 * Specify the base URL to use for RSS feed links.
	 * We recommend using the [endpoint context object](https://docs.astro.build/en/reference/api-reference/#site),
	 * which includes the `site` configured in your project's `astro.config.*`
	 */
	site: z.infer<typeof rssOptionsValidator>['site'] | URL;
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
	trailingSlash?: z.infer<typeof rssOptionsValidator>['trailingSlash'];
};
export type RSSFeedItem = {
	/** Link to item */
	link?: z.infer<typeof rssSchema>['link'];
	/** Full content of the item. Should be valid HTML */
	content?: z.infer<typeof rssSchema>['content'];
	/** Title of item */
	title?: z.infer<typeof rssSchema>['title'];
	/** Publication date of item */
	pubDate?: z.infer<typeof rssSchema>['pubDate'];
	/** Item description */
	description?: z.infer<typeof rssSchema>['description'];
	/** Append some other XML-valid data to this item */
	customData?: z.infer<typeof rssSchema>['customData'];
	/** Categories or tags related to the item */
	categories?: z.infer<typeof rssSchema>['categories'];
	/** The item author's email address */
	author?: z.infer<typeof rssSchema>['author'];
	/** A URL of a page for comments related to the item */
	commentsUrl?: z.infer<typeof rssSchema>['commentsUrl'];
	/** The RSS channel that the item came from */
	source?: z.infer<typeof rssSchema>['source'];
	/** A media object that belongs to the item */
	enclosure?: z.infer<typeof rssSchema>['enclosure'];
};
type ValidatedRSSFeedItem = z.infer<typeof rssSchema>;
type GlobResult = z.infer<typeof globResultValidator>;
declare const globResultValidator: z.ZodRecord<
	z.ZodString,
	z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodPromise<z.ZodAny>>
>;
declare const rssOptionsValidator: z.ZodObject<
	{
		title: z.ZodString;
		description: z.ZodString;
		site: z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodString>;
		items: z.ZodPipe<
			z.ZodUnion<
				[
					z.ZodArray<
						z.ZodObject<
							{
								title: z.ZodOptional<z.ZodString>;
								description: z.ZodOptional<z.ZodString>;
								pubDate: z.ZodOptional<
									z.ZodPipe<
										z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodDate]>,
										z.ZodTransform<Date, string | number | Date>
									>
								>;
								customData: z.ZodOptional<z.ZodString>;
								categories: z.ZodOptional<z.ZodArray<z.ZodString>>;
								author: z.ZodOptional<z.ZodString>;
								commentsUrl: z.ZodOptional<z.ZodString>;
								source: z.ZodOptional<
									z.ZodObject<
										{
											url: z.ZodString;
											title: z.ZodString;
										},
										z.core.$strip
									>
								>;
								enclosure: z.ZodOptional<
									z.ZodObject<
										{
											url: z.ZodString;
											length: z.ZodNumber;
											type: z.ZodString;
										},
										z.core.$strip
									>
								>;
								link: z.ZodOptional<z.ZodString>;
								content: z.ZodOptional<z.ZodString>;
							},
							z.core.$strip
						>
					>,
					z.ZodRecord<
						z.ZodString,
						z.ZodFunction<z.ZodTuple<readonly [], null>, z.ZodPromise<z.ZodAny>>
					>,
				]
			>,
			z.ZodTransform<
				{
					title?: string | undefined;
					description?: string | undefined;
					pubDate?: Date | undefined;
					customData?: string | undefined;
					categories?: string[] | undefined;
					author?: string | undefined;
					commentsUrl?: string | undefined;
					source?:
						| {
								url: string;
								title: string;
						  }
						| undefined;
					enclosure?:
						| {
								url: string;
								length: number;
								type: string;
						  }
						| undefined;
					link?: string | undefined;
					content?: string | undefined;
				}[],
				| Record<
						string,
						z.core.$InferOuterFunctionType<z.ZodTuple<readonly [], null>, z.ZodPromise<z.ZodAny>>
				  >
				| {
						title?: string | undefined;
						description?: string | undefined;
						pubDate?: Date | undefined;
						customData?: string | undefined;
						categories?: string[] | undefined;
						author?: string | undefined;
						commentsUrl?: string | undefined;
						source?:
							| {
									url: string;
									title: string;
							  }
							| undefined;
						enclosure?:
							| {
									url: string;
									length: number;
									type: string;
							  }
							| undefined;
						link?: string | undefined;
						content?: string | undefined;
				  }[]
			>
		>;
		xmlns: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
		stylesheet: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodBoolean]>>;
		customData: z.ZodOptional<z.ZodString>;
		trailingSlash: z.ZodDefault<z.ZodBoolean>;
	},
	z.core.$strip
>;
export default function getRssResponse(rssOptions: RSSOptions): Promise<Response>;
export declare function getRssString(rssOptions: RSSOptions): Promise<string>;
export declare function pagesGlobToRssItems(items: GlobResult): Promise<ValidatedRSSFeedItem[]>;
