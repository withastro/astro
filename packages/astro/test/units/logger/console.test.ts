import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createConsoleLogger } from '../../../dist/core/logger/impls/console.js';

describe('createConsoleLogger', () => {
	let consoleInfoCalls: string[];
	let consoleErrorCalls: string[];
	let originalInfo: typeof console.info;
	let originalError: typeof console.error;

	beforeEach(() => {
		consoleInfoCalls = [];
		consoleErrorCalls = [];
		originalInfo = console.info;
		originalError = console.error;
		console.info = (...args: unknown[]) => {
			consoleInfoCalls.push(args.map(String).join(' '));
		};
		console.error = (...args: unknown[]) => {
			consoleErrorCalls.push(args.map(String).join(' '));
		};
	});

	afterEach(() => {
		console.info = originalInfo;
		console.error = originalError;
	});

	it('sets the logger level from the config object', () => {
		const logger = createConsoleLogger({ level: 'warn' });
		assert.equal(logger.level(), 'warn');
	});

	it('emits error-level messages to console.error', () => {
		const logger = createConsoleLogger({ level: 'info' });
		logger.error('build', 'something broke');
		assert.equal(consoleErrorCalls.length, 1);
		assert.ok(consoleErrorCalls[0].includes('something broke'));
	});

	it('emits info-level messages to console.info', () => {
		const logger = createConsoleLogger({ level: 'info' });
		logger.info('build', 'compiled');
		assert.equal(consoleInfoCalls.length, 1);
		assert.ok(consoleInfoCalls[0].includes('compiled'));
	});

	it('respects the configured level and filters lower-priority messages', () => {
		const logger = createConsoleLogger({ level: 'error' });
		logger.info('build', 'should be filtered');
		logger.warn('build', 'should be filtered');
		assert.equal(consoleInfoCalls.length, 0);
		assert.equal(consoleErrorCalls.length, 0);

		logger.error('build', 'should pass');
		assert.equal(consoleErrorCalls.length, 1);
	});
});
