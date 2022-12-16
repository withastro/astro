declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof typeof entryMap> =
		typeof entryMap[C][keyof typeof entryMap[C]] & Render;

	type BaseCollectionConfig<S extends import('astro/zod').ZodRawShape> = {
		schema?: S;
		slug?: (entry: {
			id: CollectionEntry<keyof typeof entryMap>['id'];
			defaultSlug: string;
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
	): Promise<typeof entryMap[C][E] & Render>;
	export function getCollection<
		C extends keyof typeof entryMap,
		E extends keyof typeof entryMap[C]
	>(
		collection: C,
		filter?: (data: typeof entryMap[C][E]) => boolean
	): Promise<(typeof entryMap[C][E] & Render)[]>;

	type InferEntrySchema<C extends keyof typeof entryMap> = import('astro/zod').infer<
		import('astro/zod').ZodObject<Required<ContentConfig['collections'][C]>['schema']>
	>;

	type Render = {
		render(): Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			injectedFrontmatter: Record<string, any>;
		}>;
	};

	const entryMap: {
		"with-schema-config": {
"one.md": {
  id: "one.md",
  slug: "one",
  body: string,
  collection: "with-schema-config",
  data: InferEntrySchema<"with-schema-config">
},
"three.md": {
  id: "three.md",
  slug: "three",
  body: string,
  collection: "with-schema-config",
  data: InferEntrySchema<"with-schema-config">
},
"two.md": {
  id: "two.md",
  slug: "two",
  body: string,
  collection: "with-schema-config",
  data: InferEntrySchema<"with-schema-config">
},
},
"with-slug-config": {
"one.md": {
  id: "one.md",
  slug: string,
  body: string,
  collection: "with-slug-config",
  data: InferEntrySchema<"with-slug-config">
},
"three.md": {
  id: "three.md",
  slug: string,
  body: string,
  collection: "with-slug-config",
  data: InferEntrySchema<"with-slug-config">
},
"two.md": {
  id: "two.md",
  slug: string,
  body: string,
  collection: "with-slug-config",
  data: InferEntrySchema<"with-slug-config">
},
},
"without-config": {
"columbia.md": {
  id: "columbia.md",
  slug: "columbia",
  body: string,
  collection: "without-config",
  data: any
},
"endeavour.md": {
  id: "endeavour.md",
  slug: "endeavour",
  body: string,
  collection: "without-config",
  data: any
},
"enterprise.md": {
  id: "enterprise.md",
  slug: "enterprise",
  body: string,
  collection: "without-config",
  data: any
},
"promo/launch-week.mdx": {
  id: "promo/launch-week.mdx",
  slug: "promo/launch-week",
  body: string,
  collection: "without-config",
  data: any
},
},

	};

	type ContentConfig = typeof import("./config");
}
