import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeConfig } from '../../../dist/core/config/index.js';

describe('mergeConfig', () => {
	it('keeps server.allowedHosts as boolean', () => {
		const defaults = {
			server: {
				// Typed as string[] to match AstroConfig's allowedHosts field
				allowedHosts: [] as string[],
			},
		};
		// allowedHosts can also be true (allow all) — cast to satisfy DeepPartial
		const overrides = {
			server: {
				allowedHosts: true as boolean | string[],
			},
		};
		const merged = mergeConfig(defaults, overrides as typeof defaults);
		assert.equal(merged.server.allowedHosts, true);
	});
});
