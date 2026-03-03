import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeConfig } from '../../../dist/core/config/index.js';

describe('mergeConfig', () => {
	it('keeps server.allowedHosts as boolean', () => {
		const defaults = {
			server: {
				allowedHosts: [],
			},
		};
		const overrides = {
			server: {
				allowedHosts: true,
			},
		};
		const merged = mergeConfig(defaults, overrides);
		assert.equal(merged.server.allowedHosts, true);
	});
});
