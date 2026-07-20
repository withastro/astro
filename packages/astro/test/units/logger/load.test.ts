import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadLoggerDestination } from '../../../dist/core/logger/load.js';

// A real logger impl module on disk whose default export returns a destination.
const CONSOLE_IMPL_URL = new URL('../../../dist/core/logger/impls/console.js', import.meta.url);

describe('loadLoggerDestination', () => {
	it('loads a custom logger destination from a string entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: CONSOLE_IMPL_URL.href });
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a custom logger destination from a URL entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: CONSOLE_IMPL_URL });
		assert.equal(typeof destination.write, 'function');
	});

	it('loads composed logger destinations from URL entrypoints', async () => {
		const destination = await loadLoggerDestination({
			entrypoint: 'astro/logger/compose',
			config: {
				loggers: [{ entrypoint: CONSOLE_IMPL_URL }, { entrypoint: CONSOLE_IMPL_URL }],
			},
		});
		assert.equal(typeof destination.write, 'function');
	});

	it('throws with the resolved href when a URL entrypoint cannot be loaded', async () => {
		const missing = new URL('../../../dist/core/logger/impls/does-not-exist.js', import.meta.url);
		await assert.rejects(loadLoggerDestination({ entrypoint: missing }), (error: Error) => {
			// The error message should surface the normalized href, not "[object URL]".
			assert.match(error.message, /does-not-exist\.js/);
			return true;
		});
	});
});
