import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type z from 'zod';
import { fontFamilySchema, type fontProviderSchema } from '../../src/assets/fonts/config.js';
import type { FontFamily, FontProvider } from '../../src/assets/fonts/types.js';

describe('fonts', () => {
	it('FontFamily type matches fontFamilySchema', () => {
		const _schema = fontFamilySchema.omit({ options: true });
		expectTypeOf<z.input<typeof _schema>>().toEqualTypeOf<Omit<FontFamily, 'options'>>();
	});

	it('FontProvider type matches fontProviderSchema', () => {
		expectTypeOf<z.input<typeof fontProviderSchema>>().toEqualTypeOf<FontProvider>();
	});
});
