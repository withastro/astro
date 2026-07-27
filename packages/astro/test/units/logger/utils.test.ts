import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeLoggerConfig } from '../../../dist/core/logger/utils.js';

describe('normalizeLoggerConfig', () => {
	it('normalizes URL entrypoints into file paths', () => {
		const entrypoint = new URL('./logger.mjs', import.meta.url);
		const normalized = normalizeLoggerConfig({ entrypoint });
		assert.equal(normalized.entrypoint, entrypoint.pathname);
	});

	it('normalizes nested composed loggers', () => {
		const normalized = normalizeLoggerConfig({
			entrypoint: 'astro/logger/compose',
			config: {
				loggers: [
					{ entrypoint: 'astro/logger/json' },
					{
						entrypoint: 'astro/logger/compose',
						config: { loggers: [{ entrypoint: 'astro/logger/console' }] },
					},
				],
			},
		});
		assert.equal(normalized.loggers?.[1].loggers?.[0].entrypoint, 'astro/logger/console');
	});

	it('normalizes a composed logger without children', () => {
		const normalized = normalizeLoggerConfig({ entrypoint: 'astro/logger/compose' });
		assert.deepEqual(normalized.loggers, []);
	});
});
