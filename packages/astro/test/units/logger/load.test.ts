import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadLoggerDestination } from '../../../dist/core/logger/load.js';

// A real logger impl module on disk whose default export returns a destination.
const CONSOLE_IMPL_URL = new URL('../../../dist/core/logger/impls/console.js', import.meta.url);
// Used as the project root, so that `./console.js` points at the impl above.
const IMPLS_ROOT = new URL('../../../dist/core/logger/impls/', import.meta.url);

describe('loadLoggerDestination', () => {
	it('loads a custom logger destination from a string entrypoint', async () => {
		const destination = await loadLoggerDestination(
			{ entrypoint: CONSOLE_IMPL_URL.href },
			IMPLS_ROOT,
		);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a custom logger destination from a URL entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: CONSOLE_IMPL_URL }, IMPLS_ROOT);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a custom logger destination from a relative entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: './console.js' }, IMPLS_ROOT);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a built-in logger destination from a package entrypoint', async () => {
		const destination = await loadLoggerDestination(
			{ entrypoint: 'astro/logger/json' },
			IMPLS_ROOT,
		);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads composed logger destinations from URL entrypoints', async () => {
		const destination = await loadLoggerDestination(
			{
				entrypoint: 'astro/logger/compose',
				config: {
					loggers: [{ entrypoint: CONSOLE_IMPL_URL }, { entrypoint: './console.js' }],
				},
			},
			IMPLS_ROOT,
		);
		assert.equal(typeof destination.write, 'function');
	});

	it('throws with the resolved path when a URL entrypoint cannot be loaded', async () => {
		const missing = new URL('../../../dist/core/logger/impls/does-not-exist.js', import.meta.url);
		await assert.rejects(
			loadLoggerDestination({ entrypoint: missing }, IMPLS_ROOT),
			(error: Error) => {
				// The error message should surface the normalized path, not "[object URL]".
				assert.match(error.message, /does-not-exist\.js/);
				return true;
			},
		);
	});

	it('throws with the resolved path when a relative entrypoint cannot be loaded', async () => {
		await assert.rejects(
			loadLoggerDestination({ entrypoint: './does-not-exist.js' }, IMPLS_ROOT),
			(error: Error) => {
				assert.match(error.message, /impls[/\\]does-not-exist\.js/);
				return true;
			},
		);
	});
});
