import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import { loadLogger } from '../../../dist/core/logger/load.js';

// A real logger impl module on disk whose default export returns a destination.
const CONSOLE_IMPL_URL = new URL('../../../dist/core/logger/impls/console.js', import.meta.url);

describe('loadLogger', () => {
	it('loads a custom logger from a string entrypoint', async () => {
		const logger = await loadLogger({ entrypoint: CONSOLE_IMPL_URL.href });
		assert.ok(logger instanceof AstroLogger);
	});

	it('loads a custom logger from a URL entrypoint', async () => {
		const logger = await loadLogger({ entrypoint: CONSOLE_IMPL_URL });
		assert.ok(logger instanceof AstroLogger);
	});

	it('loads composed loggers from URL entrypoints', async () => {
		const logger = await loadLogger({
			entrypoint: 'astro/logger/compose',
			config: {
				loggers: [{ entrypoint: CONSOLE_IMPL_URL }, { entrypoint: CONSOLE_IMPL_URL }],
			},
		});
		assert.ok(logger instanceof AstroLogger);
	});

	it('throws with the resolved href when a URL entrypoint cannot be loaded', async () => {
		const missing = new URL('../../../dist/core/logger/impls/does-not-exist.js', import.meta.url);
		await assert.rejects(loadLogger({ entrypoint: missing }), (error: Error) => {
			// The error message should surface the normalized href, not "[object URL]".
			assert.match(error.message, /does-not-exist\.js/);
			return true;
		});
	});
});
