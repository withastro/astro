import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SpyLogger } from '../test-utils.ts';

describe('SpyLogger', () => {
	it('captures direct info/warn/error writes', () => {
		const spy = new SpyLogger();

		spy.info(null, 'info msg');
		spy.warn(null, 'warn msg');
		spy.error(null, 'error msg');

		assert.equal(spy.logs.length, 3);
		assert.deepStrictEqual(spy.logs, [
			{ level: 'info', label: null, message: 'info msg' },
			{ level: 'warn', label: null, message: 'warn msg' },
			{ level: 'error', label: null, message: 'error msg' },
		]);
		assert.equal(spy.writeCount(), 3);
	});

	it('preserves labels on direct writes', () => {
		const spy = new SpyLogger();

		spy.info('config', 'loaded');
		spy.warn('build', 'deprecation');

		assert.equal(spy.logs[0].label, 'config');
		assert.equal(spy.logs[1].label, 'build');
	});

	describe('forkIntegrationLogger', () => {
		it('captures writes from forked integration loggers', () => {
			const spy = new SpyLogger();
			const intLogger = spy.forkIntegrationLogger('my-integration');

			intLogger.info('hello');
			intLogger.warn('caution');
			intLogger.error('failure');

			assert.equal(spy.logs.length, 3);
			assert.deepStrictEqual(spy.logs, [
				{ level: 'info', label: 'my-integration', message: 'hello' },
				{ level: 'warn', label: 'my-integration', message: 'caution' },
				{ level: 'error', label: 'my-integration', message: 'failure' },
			]);
		});

		it('counts integration logger writes in writeCount()', () => {
			const spy = new SpyLogger();
			const intLogger = spy.forkIntegrationLogger('adapter');

			intLogger.warn('a');
			intLogger.error('b');

			assert.equal(spy.writeCount(), 2);
		});

		it('intermixes direct and integration logger writes in order', () => {
			const spy = new SpyLogger();
			const intLogger = spy.forkIntegrationLogger('plugin');

			spy.info(null, 'first');
			intLogger.warn('second');
			spy.error('build', 'third');

			assert.equal(spy.logs.length, 3);
			assert.equal(spy.logs[0].message, 'first');
			assert.equal(spy.logs[1].message, 'second');
			assert.equal(spy.logs[2].message, 'third');
			assert.equal(spy.writeCount(), 3);
		});

		it('captures writes from further-forked integration loggers', () => {
			const spy = new SpyLogger();
			const intLogger = spy.forkIntegrationLogger('parent');
			const childLogger = intLogger.fork('child');

			childLogger.warn('from child');

			assert.equal(spy.logs.length, 1);
			assert.equal(spy.logs[0].label, 'child');
			assert.equal(spy.logs[0].message, 'from child');
		});
	});

	describe('level filtering', () => {
		it('defaults to debug level (captures everything)', () => {
			const spy = new SpyLogger();
			spy.info(null, 'info');
			spy.warn(null, 'warn');
			spy.error(null, 'error');

			assert.equal(spy.logs.length, 3);
		});

		it('respects custom level and filters accordingly', () => {
			const spy = new SpyLogger({ level: 'warn' });
			spy.info(null, 'should be filtered');
			spy.warn(null, 'should pass');
			spy.error(null, 'should also pass');

			assert.equal(spy.logs.length, 2);
			assert.equal(spy.logs[0].level, 'warn');
			assert.equal(spy.logs[1].level, 'error');
		});

		it('applies level filtering to forked integration loggers', () => {
			const spy = new SpyLogger({ level: 'error' });
			const intLogger = spy.forkIntegrationLogger('test');

			intLogger.info('filtered');
			intLogger.warn('filtered');
			intLogger.error('captured');

			assert.equal(spy.logs.length, 1);
			assert.equal(spy.logs[0].level, 'error');
		});
	});

	describe('counters', () => {
		it('tracks flush calls', () => {
			const spy = new SpyLogger();

			assert.equal(spy.flushCount(), 0);
			spy.flush();
			spy.flush();
			assert.equal(spy.flushCount(), 2);
		});

		it('tracks close calls', () => {
			const spy = new SpyLogger();

			assert.equal(spy.closeCount(), 0);
			spy.close();
			assert.equal(spy.closeCount(), 1);
		});
	});
});
