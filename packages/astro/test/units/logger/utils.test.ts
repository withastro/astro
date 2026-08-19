import * as assert from 'node:assert/strict';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { normalizeLoggerConfig } from '../../../dist/core/logger/utils.js';

const ROOT = new URL('./fixture-root/', import.meta.url);
const ROOT_PATH = fileURLToPath(ROOT);

describe('normalizeLoggerConfig', () => {
	// A platform path, not a `file://` href: Vite resolves paths, and `load.ts` turns
	// them back into URLs for `import()`. `pathname` would keep the leading slash of
	// `/D:/…` on Windows.
	it('normalizes URL entrypoints into file paths', () => {
		const entrypoint = new URL('./logger.mjs', import.meta.url);
		const normalized = normalizeLoggerConfig({ entrypoint }, ROOT);
		assert.equal(normalized.entrypoint, fileURLToPath(entrypoint));
		assert.ok(isAbsolute(normalized.entrypoint));
	});

	it('normalizes relative entrypoints against the project root', () => {
		const normalized = normalizeLoggerConfig({ entrypoint: './src/logger.mjs' }, ROOT);
		assert.equal(normalized.entrypoint, join(ROOT_PATH, 'src', 'logger.mjs'));
		assert.ok(isAbsolute(normalized.entrypoint));
	});

	it('normalizes entrypoints pointing outside of the project root', () => {
		const normalized = normalizeLoggerConfig({ entrypoint: '../shared/logger.mjs' }, ROOT);
		assert.equal(normalized.entrypoint, join(ROOT_PATH, '..', 'shared', 'logger.mjs'));
	});

	it('leaves package specifiers untouched', () => {
		// A bare specifier starting with a dot-less segment must not be mistaken for a path,
		// and neither must scoped packages.
		for (const entrypoint of ['astro/logger/json', '@org/astro-logger']) {
			const normalized = normalizeLoggerConfig({ entrypoint }, ROOT);
			assert.equal(normalized.entrypoint, entrypoint);
		}
	});

	it('leaves absolute path entrypoints untouched', () => {
		const entrypoint = join(ROOT_PATH, 'src', 'logger.mjs');
		const normalized = normalizeLoggerConfig({ entrypoint }, ROOT);
		assert.equal(normalized.entrypoint, entrypoint);
	});

	it('normalizes nested composed loggers', () => {
		const normalized = normalizeLoggerConfig(
			{
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
			},
			ROOT,
		);
		assert.equal(normalized.loggers?.[1].loggers?.[0].entrypoint, 'astro/logger/console');
	});

	it('normalizes relative entrypoints of nested composed loggers', () => {
		const normalized = normalizeLoggerConfig(
			{
				entrypoint: 'astro/logger/compose',
				config: {
					loggers: [
						{ entrypoint: './src/logger.mjs' },
						{
							entrypoint: 'astro/logger/compose',
							config: { loggers: [{ entrypoint: './src/nested-logger.mjs' }] },
						},
					],
				},
			},
			ROOT,
		);
		assert.equal(normalized.loggers?.[0].entrypoint, join(ROOT_PATH, 'src', 'logger.mjs'));
		assert.equal(
			normalized.loggers?.[1].loggers?.[0].entrypoint,
			join(ROOT_PATH, 'src', 'nested-logger.mjs'),
		);
	});

	it('normalizes a composed logger without children', () => {
		const normalized = normalizeLoggerConfig({ entrypoint: 'astro/logger/compose' }, ROOT);
		assert.deepEqual(normalized.loggers, []);
	});
});
