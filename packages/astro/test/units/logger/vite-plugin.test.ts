import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emitDestination } from '../../../dist/core/logger/vite-plugin.js';

/** Resolves any entrypoint, so tests can assert on the emitted ids. */
const resolveAll = async (entrypoint: string) => `/resolved/${entrypoint}`;

describe('emitDestination', () => {
	it('imports the resolved entrypoint and instantiates it with the config', async () => {
		const { expression, imports } = await emitDestination(
			{ entrypoint: 'astro/logger/json', config: { level: 'info' } },
			resolveAll,
		);

		assert.deepEqual(imports, ['import _logger0 from "/resolved/astro/logger/json";']);
		assert.equal(expression, '_logger0({"level":"info"})');
	});

	it('instantiates with `undefined` when no config is provided', async () => {
		const { expression } = await emitDestination({ entrypoint: 'astro/logger/json' }, resolveAll);
		assert.equal(expression, '_logger0(undefined)');
	});

	it('starts numbering at the given offset', async () => {
		const { expression, imports } = await emitDestination(
			{ entrypoint: 'astro/logger/json' },
			resolveAll,
			3,
		);

		assert.deepEqual(imports, ['import _logger3 from "/resolved/astro/logger/json";']);
		assert.equal(expression, '_logger3(undefined)');
	});

	it('inlines composed destinations under unique import names', async () => {
		const { expression, imports } = await emitDestination(
			{
				entrypoint: 'astro/logger/compose',
				loggers: [
					{ entrypoint: 'astro/logger/json', config: { level: 'warn' } },
					{ entrypoint: 'astro/logger/console' },
				],
			},
			resolveAll,
		);

		assert.deepEqual(imports, [
			'import _logger0 from "/resolved/astro/logger/compose";',
			'import _logger1 from "/resolved/astro/logger/json";',
			'import _logger2 from "/resolved/astro/logger/console";',
		]);
		assert.equal(expression, '_logger0([_logger1({"level":"warn"}), _logger2(undefined)])');
	});

	it('keeps import names unique across nested composed destinations', async () => {
		const { expression, imports } = await emitDestination(
			{
				entrypoint: 'astro/logger/compose',
				loggers: [
					{
						entrypoint: 'astro/logger/compose',
						loggers: [{ entrypoint: 'astro/logger/json' }],
					},
					{ entrypoint: 'astro/logger/console' },
				],
			},
			resolveAll,
		);

		const names = imports.map((statement: string) => /^import (_logger\d+) /.exec(statement)![1]);
		assert.deepEqual(names, ['_logger0', '_logger1', '_logger2', '_logger3']);
		assert.equal(expression, '_logger0([_logger1([_logger2(undefined)]), _logger3(undefined)])');
	});

	it('emits an empty composed destination when it has no children', async () => {
		const { expression } = await emitDestination(
			{ entrypoint: 'astro/logger/compose', loggers: [] },
			resolveAll,
		);
		assert.equal(expression, '_logger0([])');
	});

	it('throws when an entrypoint cannot be resolved', async () => {
		await assert.rejects(
			emitDestination({ entrypoint: './missing-logger.js' }, async () => null),
			/Couldn't load the logger at given path ".\/missing-logger.js"/,
		);
	});

	it('keeps the resolution error as the cause when resolving throws', async () => {
		const cause = new Error('Invalid package specifier');
		await assert.rejects(
			emitDestination({ entrypoint: 'not a specifier' }, async () => {
				throw cause;
			}),
			(error: Error) => {
				assert.match(error.message, /Couldn't load the logger/);
				assert.equal(error.cause, cause);
				return true;
			},
		);
	});
});
