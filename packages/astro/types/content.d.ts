declare module 'astro:content' {
	import zod from 'astro/zod';
	export type {
		ImageFunction,
		DataEntry,
		DataStore,
		MetaStore,
		BaseSchema,
		SchemaContext,
	} from 'astro/content/config';
	export { defineLiveCollection, defineCollection } from 'astro/content/config';

	// TODO: remove in Astro 7
	/**
	 * @deprecated
	 * `import { z } from 'astro:content'` is deprecated and will be removed
	 * in Astro 7. Use `import { z } from 'astro/zod'` instead.
	 */
	export const z = zod.z;

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
