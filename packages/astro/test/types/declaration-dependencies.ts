import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { ContextProvider, FetchState } from '../../dist/core/fetch/fetch-state.js';
import type {
	AstroAdapter,
	AstroAdapterClientConfig,
} from '../../dist/types/public/integrations.js';

describe('published declaration dependencies', () => {
	it('retains adapter client configuration', () => {
		expectTypeOf<NonNullable<AstroAdapter['client']>>().not.toBeAny();
		expectTypeOf<NonNullable<AstroAdapter['client']>>().toEqualTypeOf<AstroAdapterClientConfig>();
		expectTypeOf<AstroAdapterClientConfig['assetQueryParams']>().toEqualTypeOf<
			URLSearchParams | undefined
		>();
	});

	it('retains context provider callbacks', () => {
		expectTypeOf<Parameters<FetchState['provide']>[1]>().not.toBeAny();
		expectTypeOf<ContextProvider<string>['create']>().toEqualTypeOf<() => string>();
		expectTypeOf<NonNullable<ContextProvider<string>['finalize']>>().toEqualTypeOf<
			(value: string) => Promise<void> | void
		>();
	});
});
