import type { DataStoreSource, DataStoreSourceFactory } from './data-store-source.js';

export type ContentCollectionStorageReader = DataStoreSource;
export type ContentCollectionStorageReaderFactory<
	TConfig extends Record<string, unknown> = Record<string, unknown>,
> = DataStoreSourceFactory<TConfig>;

export type ContentCollectionData = Map<string, Map<string, unknown>>;

export interface ContentCollectionStorageWriter {
	write(collections: ContentCollectionData): Promise<void>;
}

export type ContentCollectionStorageWriterFactory<
	TConfig extends Record<string, unknown> = Record<string, unknown>,
> = (
	config: TConfig | undefined,
) => ContentCollectionStorageWriter | Promise<ContentCollectionStorageWriter>;
