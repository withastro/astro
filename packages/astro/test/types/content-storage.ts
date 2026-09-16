import { describe, it } from 'node:test';
import type { AstroAdapter } from 'astro';
import type {
	ContentCollectionStorageReaderFactory,
	ContentCollectionStorageWriterFactory,
} from 'astro/content/storage';
import { expectTypeOf } from 'expect-type';

describe('content collection storage', () => {
	it('exposes adapter and provider contracts', () => {
		expectTypeOf<NonNullable<AstroAdapter['contentCollectionStorage']>>().toEqualTypeOf<{
			reader: {
				entrypoint: string | URL;
				config?: Record<string, unknown>;
			};
			writer: {
				entrypoint: string | URL;
				config?: Record<string, unknown>;
			};
		}>();

		expectTypeOf<ContentCollectionStorageReaderFactory>().toBeFunction();
		expectTypeOf<ContentCollectionStorageWriterFactory>().toBeFunction();
	});
});
