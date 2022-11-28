declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof typeof entryMap> =
		typeof entryMap[C][keyof typeof entryMap[C]];
	export function collectionToPaths<C extends keyof typeof entryMap>(
		collection: C
	): Promise<import('astro').GetStaticPathsResult>;
	export function defineCollections<
		C extends Record<keyof typeof entryMap, { schema: import('astro/zod').ZodRawShape }>
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
		"docs": {
"en/introduction.md": {
  id: "en/introduction.md",
  slug: "en/introduction",
  body: string,
  collection: "docs",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["docs"]['schema']>>
},
"en/page-2.md": {
  id: "en/page-2.md",
  slug: "en/page-2",
  body: string,
  collection: "docs",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["docs"]['schema']>>
},
"en/page-3.md": {
  id: "en/page-3.md",
  slug: "en/page-3",
  body: string,
  collection: "docs",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["docs"]['schema']>>
},
"en/page-4.md": {
  id: "en/page-4.md",
  slug: "en/page-4",
  body: string,
  collection: "docs",
  data: import('astro/zod').infer<import('astro/zod').ZodObject<CollectionsConfig['default']["docs"]['schema']>>
},
},

	};

	type CollectionsConfig = typeof import('/Users/benholmes/Repositories/astro/examples/docs/src/content/config');
}
