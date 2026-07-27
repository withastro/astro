import * as assert from 'node:assert/strict';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { normalizeLoggerConfig } from '../../../dist/core/logger/utils.js';

describe('normalizeLoggerConfig', () => {
	// A platform path, not a `file://` href: Vite resolves paths, and `load.ts` turns
	// them back into URLs for `import()`. `pathname` would keep the leading slash of
	// `/D:/…` on Windows.
	it('normalizes URL entrypoints into file paths', () => {
		const entrypoint = new URL('./logger.mjs', import.meta.url);
		const normalized = normalizeLoggerConfig({ entrypoint });
		assert.equal(normalized.entrypoint, fileURLToPath(entrypoint));
		assert.ok(isAbsolute(normalized.entrypoint));
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
