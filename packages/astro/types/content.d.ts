declare module 'astro:content' {
	export { z } from 'astro/zod';
	export type {
		ImageFunction,
		DataEntry,
		DataStore,
		MetaStore,
		BaseSchema,
		SchemaContext,
	} from 'astro/content/config';

	export function defineLiveCollection<
		L extends import('astro/loaders').LiveLoader,
		S extends import('astro/content/config').BaseSchema | undefined = undefined,
	>(
		config: import('astro/content/config').LiveCollectionConfig<L, S>,
	): import('astro/content/config').LiveCollectionConfig<L, S>;

	export function defineCollection<S extends import('astro/content/config').BaseSchema>(
		config: import('astro/content/config').CollectionConfig<S>,
	): import('astro/content/config').CollectionConfig<S>;

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
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getLiveCollection: (...args: any[]) => any;
	/** Run `astro dev` or `astro sync` to generate high fidelity types */
	export const getLiveEntry: (...args: any[]) => any;
}
