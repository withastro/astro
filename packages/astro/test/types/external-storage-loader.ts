import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineCollection } from 'astro/content/config';
import {
	type AsyncDataStore,
	type DataStore,
	type ExternalLoaderContext,
	type ExternalStorageLoader,
	isExternalLoaderContext,
	type Loader,
	type LoaderContext,
	type MetaStore,
} from 'astro/loaders';

describe('external storage loaders', () => {
	it('keeps the store types of other collections', () => {
		expectTypeOf<LoaderContext['store']>().toEqualTypeOf<DataStore>();
		expectTypeOf<LoaderContext['meta']>().toEqualTypeOf<MetaStore>();
		expectTypeOf<ReturnType<DataStore['keys']>>().toEqualTypeOf<string[]>();
	});

	it('accepts loaders that support external storage', () => {
		const loader: ExternalStorageLoader = {
			name: 'test-loader',
			supportsExternalStorage: true,
			async load(context) {
				if (isExternalLoaderContext(context)) {
					expectTypeOf(context).toEqualTypeOf<ExternalLoaderContext>();
					expectTypeOf(context.store).toEqualTypeOf<AsyncDataStore>();
					await context.store.set({ id: 'a', data: {} });
				} else {
					expectTypeOf(context).toEqualTypeOf<LoaderContext>();
					context.store.set({ id: 'a', data: {} });
				}
			},
		};

		expectTypeOf(loader).toExtend<Loader>();
		defineCollection({ loader, storage: 'external' });
	});
});
