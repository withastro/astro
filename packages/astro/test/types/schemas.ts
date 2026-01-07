import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type z from 'zod';
import type {
	localFontFamilySchema,
	remoteFontFamilySchema,
} from '../../src/assets/fonts/config.js';
import type { LocalFontFamily, RemoteFontFamily } from '../../src/assets/fonts/types.js';
import type { SessionDriverConfigSchema } from '../../dist/core/session/config.js';
import type { SessionDriverConfig } from '../../dist/core/session/types.js';

describe('fonts', () => {
	it('LocalFontFamily type matches localFontFamilySchema', () => {
		expectTypeOf<z.input<typeof localFontFamilySchema>>().toEqualTypeOf<LocalFontFamily>();
	});

	it('RemoteFontFamily type matches remoteFontFamilySchema', () => {
		expectTypeOf<z.input<typeof remoteFontFamilySchema>>().toEqualTypeOf<RemoteFontFamily>();
	});
});

describe('session', () => {
	it('SessionDriverConfig type matches SessionDriverConfigSchema', () => {
		expectTypeOf<z.input<typeof SessionDriverConfigSchema>>().toEqualTypeOf<SessionDriverConfig>();
	});
});
