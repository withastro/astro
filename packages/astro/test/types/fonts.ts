import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type z from 'zod';
import type {
	fontProviderSchema,
	localFontFamilySchema,
	remoteFontFamilySchema,
} from '../../src/assets/fonts/config.js';
import type {
	FontProvider,
	LocalFontFamily,
	RemoteFontFamily,
} from '../../src/assets/fonts/types.js';

describe('fonts', () => {
	it('LocalFontFamily type matches localFontFamilySchema', () => {
		expectTypeOf<z.input<typeof localFontFamilySchema>>().toEqualTypeOf<LocalFontFamily>();
	});

	it('RemoteFontFamily type matches remoteFontFamilySchema', () => {
		expectTypeOf<z.input<typeof remoteFontFamilySchema>>().toEqualTypeOf<RemoteFontFamily>();
	});

	it('FontProvider type matches fontProviderSchema', () => {
		expectTypeOf<z.input<typeof fontProviderSchema>>().toEqualTypeOf<FontProvider>();
	});
});
