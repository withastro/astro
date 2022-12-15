declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof typeof entryMap> =
		typeof entryMap[C][keyof typeof entryMap[C]];
	export function collectionToPaths<C extends keyof typeof entryMap>(
		collection: C
	): Promise<import('astro').GetStaticPathsResult>;

	type BaseCollectionConfig<S extends import('astro/zod').ZodRawShape> = {
		schema?: S;
		slug?: (entry: {
			id: CollectionEntry<keyof typeof entryMap>['id'];
			defaultSlug: CollectionEntry<keyof typeof entryMap>['slug'];
			collection: string;
			body: string;
			data: import('astro/zod').infer<import('astro/zod').ZodObject<S>>;
		}) => string | Promise<string>;
	};
	export function defineCollection<S extends import('astro/zod').ZodRawShape>(
		input: BaseCollectionConfig<S>
	): BaseCollectionConfig<S>;

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
		injectedFrontmatter: Record<string, any>;
	}>;

	type InferEntrySchema<C extends keyof typeof entryMap> = import('astro/zod').infer<
		import('astro/zod').ZodObject<Required<ContentConfig['collections'][C]>['schema']>
	>;

	const entryMap: {
		"blog": {
"first-post.md": {
  id: "first-post.md",
  slug: "first-post",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"markdown-style-guide.md": {
  id: "markdown-style-guide.md",
  slug: "markdown-style-guide",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"second-post.md": {
  id: "second-post.md",
  slug: "second-post",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"third-post.md": {
  id: "third-post.md",
  slug: "third-post",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
"using-mdx.mdx": {
  id: "using-mdx.mdx",
  slug: "using-mdx",
  body: string,
  collection: "blog",
  data: InferEntrySchema<"blog">
},
},

	};

	type ContentConfig = typeof import("./config");
}
