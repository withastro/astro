import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type z from 'zod';
import {
	type fontProviderSchema,
	type localFontFamilySchema,
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
		const _schema = remoteFontFamilySchema.omit({ options: true });
		expectTypeOf<z.input<typeof _schema>>().toEqualTypeOf<Omit<RemoteFontFamily, 'options'>>();
	});

	it('FontProvider type matches fontProviderSchema', () => {
		expectTypeOf<z.input<typeof fontProviderSchema>>().toEqualTypeOf<FontProvider>();
	});
});
