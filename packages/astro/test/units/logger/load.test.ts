import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadLoggerDestination } from '../../../dist/core/logger/load.js';

// A real logger impl module on disk whose default export returns a destination.
const CONSOLE_IMPL_URL = new URL('../../../dist/core/logger/impls/console.js', import.meta.url);
// Stands in for a project root. Deliberately *not* the directory holding `load.js`, so that
// a relative entrypoint resolved against the wrong base — `import()` resolves relative
// specifiers against the importing module — cannot accidentally point at a real file.
const ROOT = new URL('../../../dist/core/', import.meta.url);

describe('loadLoggerDestination', () => {
	it('loads a custom logger destination from a string entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: CONSOLE_IMPL_URL.href }, ROOT);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a custom logger destination from a URL entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: CONSOLE_IMPL_URL }, ROOT);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a custom logger destination from a relative entrypoint', async () => {
		const destination = await loadLoggerDestination(
			{ entrypoint: './logger/impls/console.js' },
			ROOT,
		);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a custom logger destination from an entrypoint above the root', async () => {
		const destination = await loadLoggerDestination(
			{ entrypoint: '../core/logger/impls/console.js' },
			ROOT,
		);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads a built-in logger destination from a package entrypoint', async () => {
		const destination = await loadLoggerDestination({ entrypoint: 'astro/logger/json' }, ROOT);
		assert.equal(typeof destination.write, 'function');
	});

	it('loads composed logger destinations', async () => {
		const destination = await loadLoggerDestination(
			{
				entrypoint: 'astro/logger/compose',
				config: {
					loggers: [{ entrypoint: CONSOLE_IMPL_URL }, { entrypoint: './logger/impls/json.js' }],
				},
			},
			ROOT,
		);
		assert.equal(typeof destination.write, 'function');
	});

	it('throws with the resolved path when a URL entrypoint cannot be loaded', async () => {
		const missing = new URL('../../../dist/core/logger/impls/does-not-exist.js', import.meta.url);
		await assert.rejects(loadLoggerDestination({ entrypoint: missing }, ROOT), (error: Error) => {
			// The error message should surface the normalized path, not "[object URL]".
			assert.match(error.message, /does-not-exist\.js/);
			return true;
		});
	});

	it('throws with the resolved path when a relative entrypoint cannot be loaded', async () => {
		await assert.rejects(
			loadLoggerDestination({ entrypoint: './logger/does-not-exist.js' }, ROOT),
			(error: Error) => {
				// The path is reported as resolved against the root, so it says where Astro looked.
				assert.match(error.message, /logger[\\/]does-not-exist\.js/);
				assert.doesNotMatch(error.message, /"\.\//);
				return true;
			},
		);
	});
});
