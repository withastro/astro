declare const entryMap: {
	// @@ENTRY_MAP@@
};
declare const schemaMap: {
	// @@SCHEMA_MAP@@
};

declare module 'astro:content' {
	export { z } from 'zod';
	export function defineCollection<T extends import('zod').ZodObject<O>, O>(input: {
		schema: T;
	}): typeof input;
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
}
