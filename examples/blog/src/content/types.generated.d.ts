declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof typeof entryMap> =
		typeof entryMap[C][keyof typeof entryMap[C]];
	export function collectionToPaths<C extends keyof typeof entryMap>(
		collection: C
	): Promise<import('astro').GetStaticPathsResult>;
	export function defineCollections<
		C extends Record<string, { schema: import('astro/zod').ZodRawShape }>
	>(input: C): C;
	export function getEntry<C extends keyof typeof entryMap, E extends keyof typeof entryMap[C]>(
		collection: C,
		entryKey: E
	): Promise<typeof entryMap[C][E]>;
	export function getCollection<
		C extends keyof typeof entryMap,
		E extends keyof typeof entryMap[C]
	>(
		collection: C,
		filter?: (data: typeof entryMap[C][E]) => boolean
	): Promise<typeof entryMap[C][keyof typeof entryMap[C]][]>;
	export function renderEntry<
		C extends keyof typeof entryMap,
		E extends keyof typeof entryMap[C]
	>(entry: {
		collection: C;
		id: E;
	}): Promise<{
		Content: import('astro').MarkdownInstance<{}>['Content'];
		headings: import('astro').MarkdownHeading[];
	}>;

	const entryMap: {
		"blog": {
"first-post.md": {
  id: "first-post.md",
  slug: "first-post",
  body: string,
  collection: "blog",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["blog"]['schema']>>
},
"markdown-style-guide.md": {
  id: "markdown-style-guide.md",
  slug: "markdown-style-guide",
  body: string,
  collection: "blog",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["blog"]['schema']>>
},
"second-post.md": {
  id: "second-post.md",
  slug: "second-post",
  body: string,
  collection: "blog",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["blog"]['schema']>>
},
"third-post.md": {
  id: "third-post.md",
  slug: "third-post",
  body: string,
  collection: "blog",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["blog"]['schema']>>
},
"using-mdx.mdx": {
  id: "using-mdx.mdx",
  slug: "using-mdx",
  body: string,
  collection: "blog",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["blog"]['schema']>>
},
},

	};

	type CollectionsConfig = typeof import('/Users/benholmes/Repositories/astro/examples/blog/src/content/index');
}
