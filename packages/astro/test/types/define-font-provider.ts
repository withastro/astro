import { describe, it } from 'node:test';
import { defineFontProvider } from '../../dist/config/entrypoint.js';
import { expectTypeOf } from 'expect-type';
import type { FontProvider } from '../../dist/assets/fonts/types.js';

describe('defineFontProvider()', () => {
	it('Infers providers correctly', () => {
		expectTypeOf(
			defineFontProvider({
				name: 'test',
				entrypoint: 'a',
			}),
		).toEqualTypeOf<FontProvider<'test'>>();
	});
});
