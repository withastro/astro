import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type * as z from 'zod/v4';
import { type FontProviderSchema, FontFamilySchema } from '../../src/assets/fonts/config.js';
import type { FontProvider, FontFamily } from '../../src/assets/fonts/types.js';
import type { CacheSchema, RouteRulesSchema } from '../../src/core/cache/config.js';
import type { CacheProviderConfig, RouteRules } from '../../dist/core/cache/types.js';
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

describe('cache', () => {
	it('CacheSchema type matches cache config', () => {
		expectTypeOf<z.input<typeof CacheSchema>>().toEqualTypeOf<{
			provider?: CacheProviderConfig;
		}>();
	});

	it('RouteRules type matches RouteRulesSchema', () => {
		expectTypeOf<z.input<typeof RouteRulesSchema>>().toEqualTypeOf<RouteRules>();
	});
});

describe('session', () => {
	it('SessionDriverConfig type matches SessionDriverConfigSchema', () => {
		expectTypeOf<z.input<typeof SessionDriverConfigSchema>>().toEqualTypeOf<SessionDriverConfig>();
	});
});
