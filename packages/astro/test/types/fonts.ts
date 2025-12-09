import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type z from 'zod';
import type { localFontFamilySchema, remoteFontFamilySchema } from '../../dist/assets/fonts/config.js';
import type { LocalFontFamily, RemoteFontFamily } from '../../dist/assets/fonts/types.js';

describe('fonts', () => {
	it('LocalFontFamily type matches localFontFamilySchema', () => {
		expectTypeOf<z.input<typeof localFontFamilySchema>>().toEqualTypeOf<LocalFontFamily>();
	});

	it('RemoteFontFamily type matches remoteFontFamilySchema', () => {
		expectTypeOf<z.input<typeof remoteFontFamilySchema>>().toEqualTypeOf<RemoteFontFamily>();
	});
});
