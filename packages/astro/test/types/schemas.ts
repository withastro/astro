import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type * as z from 'zod/v4';
import { type FontProviderSchema, FontFamilySchema } from '../../src/assets/fonts/config.js';
import type { FontProvider, FontFamily } from '../../src/assets/fonts/types.js';
import type { SessionDriverConfigSchema } from '../../dist/core/session/config.js';
import type { SessionDriverConfig } from '../../dist/core/session/types.js';

describe('fonts', () => {
	it('FontFamily type matches FontFamilySchema', () => {
		const _schema = FontFamilySchema.omit({ options: true });
		expectTypeOf<z.input<typeof _schema>>().toEqualTypeOf<Omit<FontFamily, 'options'>>();
	});

	it('FontProvider type matches fontProviderSchema', () => {
		expectTypeOf<z.input<typeof FontProviderSchema>>().toEqualTypeOf<FontProvider>();
	});
});

describe('session', () => {
	it('SessionDriverConfig type matches SessionDriverConfigSchema', () => {
		expectTypeOf<z.input<typeof SessionDriverConfigSchema>>().toEqualTypeOf<SessionDriverConfig>();
	});
});
