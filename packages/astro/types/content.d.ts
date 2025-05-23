declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type {
		ImageFunction,
		DataEntry,
		DataStore,
		MetaStore,
		BaseSchema,
		SchemaContext,
	} from 'astro/config';

	export function defineCollection<S extends import('astro/config').BaseSchema>(
		input: import('astro/config').BaseCollectionConfig<S>,
	): import('astro/config').BaseCollectionConfig<S>;

	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getEntryBySlug: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getDataEntryById: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getCollection: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getEntry: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getEntries: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const reference: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export type CollectionKey = any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	// biome-ignore lint/correctness/noUnusedVariables: stub generic type to match generated type
	export type CollectionEntry<C> = any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export type ContentCollectionKey = any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export type DataCollectionKey = any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export type ContentConfig = any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const render: (entry: any) => any;
}
