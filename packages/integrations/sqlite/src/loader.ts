import type { LiveDataCollection, LiveDataEntry } from 'astro';
import type { LiveLoader } from 'astro/loaders';
import { getClient, tablePrefix } from 'virtual:@astrojs/sqlite/client';
import {
	type CollectionFilter,
	type EntryFilter,
	compileCollectionQuery,
	compileEntryQuery,
	compileLastModifiedQuery,
	hydrateRow,
} from './runtime/query.js';

export type {
	ArrayOperators,
	CollectionFilter,
	Condition,
	EntryFilter,
	FieldPath,
	OrderBy,
	ScalarOperators,
	SortDirection,
	Where,
} from './runtime/query.js';

export class SqliteLoaderError extends Error {
	override name = 'SqliteLoaderError';
	collection: string;
	constructor(collection: string, message: string, options?: ErrorOptions) {
		super(message, options);
		this.collection = collection;
	}
}

export interface SqliteLoaderOptions {
	/**
	 * The content collection to query. Defaults to the name of the live collection
	 * this loader is assigned to, which lets a live collection shadow a content
	 * collection of the same name.
	 */
	collection?: string;
}

/**
 * A live loader that queries a content collection mirrored into SQLite by the
 * `@astrojs/sqlite` integration.
 *
 * Pass the entry data type as a type argument to get typed filters:
 *
 * ```ts
 * import type { CollectionEntry } from 'astro:content';
 * sqlite<CollectionEntry<'posts'>['data']>()
 * ```
 */
export function sqlite<TData extends Record<string, any> = Record<string, any>>(
	options: SqliteLoaderOptions = {},
): LiveLoader<TData, EntryFilter<TData>, CollectionFilter<TData>, SqliteLoaderError> {
	const source = (collection: string) => options.collection ?? collection;
	return {
		name: '@astrojs/sqlite',
		async loadCollection({ filter, collection }) {
			try {
				const client = await getClient();
				const target = { tablePrefix, collection: source(collection) };
				const query = compileCollectionQuery(target, filter);
				const [rows, lastModified] = await Promise.all([
					client.all(query.sql, query.params),
					readLastModified(client, target.collection),
				]);
				const entries = rows.map((row) => toLiveEntry(row, collection, lastModified));
				const result: LiveDataCollection<TData> = { entries };
				if (lastModified) result.cacheHint = { tags: [collection], lastModified };
				return result;
			} catch (cause) {
				return { error: toError(collection, cause, 'collection') };
			}
		},
		async loadEntry({ filter, collection }) {
			try {
				const client = await getClient();
				const target = { tablePrefix, collection: source(collection) };
				const query = compileEntryQuery(target, filter);
				const [rows, lastModified] = await Promise.all([
					client.all(query.sql, query.params),
					readLastModified(client, target.collection),
				]);
				if (rows.length === 0) return undefined;
				return toLiveEntry(rows[0], collection, lastModified);
			} catch (cause) {
				return { error: toError(collection, cause, 'entry') };
			}
		},
	};

	function toLiveEntry(
		row: Record<string, unknown>,
		collection: string,
		lastModified: Date | undefined,
	): LiveDataEntry<TData> {
		const { id, data, rendered } = hydrateRow(row);
		const entry: LiveDataEntry<TData> = { id, data: data as TData };
		if (rendered) entry.rendered = rendered;
		entry.cacheHint = { tags: [`${collection}:${id}`] };
		if (lastModified) entry.cacheHint.lastModified = lastModified;
		return entry;
	}
}

async function readLastModified(
	client: Awaited<ReturnType<typeof getClient>>,
	collection: string,
): Promise<Date | undefined> {
	const query = compileLastModifiedQuery(collection);
	const rows = await client.all(query.sql, query.params);
	const value = rows[0]?.value;
	return typeof value === 'string' ? new Date(value) : undefined;
}

function toError(collection: string, cause: unknown, kind: 'collection' | 'entry') {
	const message = cause instanceof Error ? cause.message : String(cause);
	const hint = /no such table/i.test(message)
		? ` The collection "${collection}" has not been mirrored into the database. Check that it exists in your content config and that the @astrojs/sqlite integration is enabled.`
		: '';
	return new SqliteLoaderError(
		collection,
		`Failed to load ${kind} from collection "${collection}": ${message}${hint}`,
		{ cause },
	);
}
