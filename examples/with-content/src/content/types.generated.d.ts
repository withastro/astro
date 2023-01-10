declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type CollectionEntry<C extends keyof typeof entryMap> =
		(typeof entryMap)[C][keyof (typeof entryMap)[C]] & Render;

	type BaseSchemaWithoutEffects =
		| import('astro/zod').AnyZodObject
		| import('astro/zod').ZodUnion<import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodDiscriminatedUnion<string, import('astro/zod').AnyZodObject[]>
		| import('astro/zod').ZodIntersection<
				import('astro/zod').AnyZodObject,
				import('astro/zod').AnyZodObject
		  >;

	type BaseSchema =
		| BaseSchemaWithoutEffects
		| import('astro/zod').ZodEffects<BaseSchemaWithoutEffects>;

	type BaseCollectionConfig<S extends BaseSchema> = {
		schema?: S;
		slug?: (entry: {
			id: CollectionEntry<keyof typeof entryMap>['id'];
			defaultSlug: string;
			collection: string;
			body: string;
			data: import('astro/zod').infer<S>;
		}) => string | Promise<string>;
	};
	export function defineCollection<S extends BaseSchema>(
		input: BaseCollectionConfig<S>
	): BaseCollectionConfig<S>;

	export function getEntry<C extends keyof typeof entryMap, E extends keyof (typeof entryMap)[C]>(
		collection: C,
		entryKey: E
	): Promise<(typeof entryMap)[C][E] & Render>;
	export function getCollection<
		C extends keyof typeof entryMap,
		E extends keyof (typeof entryMap)[C]
	>(
		collection: C,
		filter?: (data: (typeof entryMap)[C][E]) => boolean
	): Promise<((typeof entryMap)[C][E] & Render)[]>;

	type InferEntrySchema<C extends keyof typeof entryMap> = import('astro/zod').infer<
		Required<ContentConfig['collections'][C]>['schema']
	>;

	type Render = {
		render(): Promise<{
			Content: import('astro').MarkdownInstance<{}>['Content'];
			headings: import('astro').MarkdownHeading[];
			remarkPluginFrontmatter: Record<string, any>;
		}>;
	};

	const entryMap: {
		blog: {
			'first-post.md': {
				id: 'first-post.md';
				slug: 'first-post';
				body: string;
				collection: 'blog';
				data: InferEntrySchema<'blog'>;
			};
			'markdown-style-guide.md': {
				id: 'markdown-style-guide.md';
				slug: 'markdown-style-guide';
				body: string;
				collection: 'blog';
				data: InferEntrySchema<'blog'>;
			};
			'second-post.md': {
				id: 'second-post.md';
				slug: 'second-post';
				body: string;
				collection: 'blog';
				data: InferEntrySchema<'blog'>;
			};
			'third-post.md': {
				id: 'third-post.md';
				slug: 'third-post';
				body: string;
				collection: 'blog';
				data: InferEntrySchema<'blog'>;
			};
			'using-mdx.mdx': {
				id: 'using-mdx.mdx';
				slug: 'using-mdx';
				body: string;
				collection: 'blog';
				data: InferEntrySchema<'blog'>;
			};
		};
	};

	type ContentConfig = typeof import('./config');
}
