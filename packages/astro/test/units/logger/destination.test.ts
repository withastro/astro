import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { AstroLogMessage, LogWritable } from '../../../src/core/logger/core.js';
import { Logger } from '../../../dist/core/logger/core.js';

let logs: AstroLogMessage[] = [];

const testDestination: LogWritable<AstroLogMessage> = {
	write(event: AstroLogMessage) {
		logs.push(event);
		return true;
	},
};

describe('log destination', () => {
	beforeEach(() => {
		logs = [];
	});

	describe('event shape', () => {
		const logger = new Logger({
			destination: testDestination,
			level: 'info',
			format: 'default',
		});

		it('info() pushes an event with level info', () => {
			logger.info('build', 'server started');
			assert.equal(logs.length, 1);
			assert.equal(logs[0].level, 'info');
			assert.equal(logs[0].label, 'build');
			assert.equal(logs[0].message, 'server started');
			assert.equal(logs[0].newLine, true);
		});

		it('warn() pushes an event with level warn', () => {
			logger.warn('build', 'deprecation notice');
			assert.equal(logs.length, 1);
			assert.equal(logs[0].level, 'warn');
			assert.equal(logs[0].label, 'build');
			assert.equal(logs[0].message, 'deprecation notice');
		});

		it('error() pushes an event with level error', () => {
			logger.error('build', 'build failed');
			assert.equal(logs.length, 1);
			assert.equal(logs[0].level, 'error');
			assert.equal(logs[0].message, 'build failed');
		});

		it('supports null label', () => {
			logger.info(null, 'no label');
			assert.equal(logs[0].label, null);
		});

		it('respects newLine parameter', () => {
			logger.info('build', 'no trailing newline', false);
			assert.equal(logs[0].newLine, false);
		});
	});

	describe('format propagation', () => {
		it('propagates default format to events', () => {
			const logger = new Logger({
				destination: testDestination,
				level: 'info',
				format: 'default',
			});
			logger.info('build', 'test');
			assert.equal(logs[0].format, 'default');
		});

		it('propagates json format to events', () => {
			const logger = new Logger({
				destination: testDestination,
				level: 'info',
				format: 'json',
			});
			logger.info('build', 'test');
			assert.equal(logs[0].format, 'json');
		});
	});

	describe('level filtering', () => {
		it('filters out info when level is warn', () => {
			const logger = new Logger({
				destination: testDestination,
				level: 'warn',
				format: 'default',
			});
			logger.info('build', 'should be filtered');
			assert.equal(logs.length, 0);
		});

		it('allows warn when level is warn', () => {
			const logger = new Logger({
				destination: testDestination,
				level: 'warn',
				format: 'default',
			});
			logger.warn('build', 'should pass');
			assert.equal(logs.length, 1);
		});

		it('allows error when level is warn', () => {
			const logger = new Logger({
				destination: testDestination,
				level: 'warn',
				format: 'default',
			});
			logger.error('build', 'should pass');
			assert.equal(logs.length, 1);
		});

		it('filters everything when level is silent', () => {
			const logger = new Logger({
				destination: testDestination,
				level: 'silent',
				format: 'default',
			});
			logger.info('build', 'nope');
			logger.warn('build', 'nope');
			logger.error('build', 'nope');
			assert.equal(logs.length, 0);
		});
	});
});
