import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { AstroLogMessage, LoggerDestination } from '../../../src/core/logger/core.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';

let logs: AstroLogMessage[] = [];
let jsonLogs: string[] = [];

const testDestination: LoggerDestination<AstroLogMessage> = {
	write(event: AstroLogMessage) {
		logs.push(event);
		return true;
	},
};

const jsonDestination: LoggerDestination<AstroLogMessage> = {
	write(event: AstroLogMessage) {
		if (event._format === 'json') {
			jsonLogs.push(JSON.stringify({ message: event.message, label: event.label }));
		}
		return true;
	},
};

describe('log destination', () => {
	beforeEach(() => {
		logs = [];
		jsonLogs = [];
	});

	describe('event shape', () => {
		const logger = new AstroLogger({
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
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'info',
				format: 'default',
			});
			logger.info('build', 'test');
			assert.equal(logs[0]._format, 'default');
		});

		it('propagates json format to events', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'info',
				format: 'json',
			});
			logger.info('build', 'test');
			assert.equal(logs[0]._format, 'json');
		});
	});

	describe('json formatting', () => {
		const logger = new AstroLogger({
			destination: jsonDestination,
			level: 'info',
			format: 'json',
		});

		it('serializes message and label as JSON', () => {
			logger.info('build', 'compiled successfully');
			assert.equal(jsonLogs.length, 1);
			assert.equal(jsonLogs[0], '{"message":"compiled successfully","label":"build"}');
		});

		it('serializes null label', () => {
			logger.info(null, 'no label message');
			assert.equal(jsonLogs[0], '{"message":"no label message","label":null}');
		});

		it('only includes message and label', () => {
			logger.warn('build', 'a warning');
			assert.equal(jsonLogs[0], '{"message":"a warning","label":"build"}');
		});

		it('does not write when format is not json', () => {
			const defaultLogger = new AstroLogger({
				destination: jsonDestination,
				level: 'info',
				format: 'default',
			});
			defaultLogger.info('build', 'should not appear');
			assert.equal(jsonLogs.length, 0);
		});
	});

	describe('level filtering', () => {
		it('filters out info when level is warn', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'warn',
				format: 'default',
			});
			logger.info('build', 'should be filtered');
			assert.equal(logs.length, 0);
		});

		it('allows warn when level is warn', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'warn',
				format: 'default',
			});
			logger.warn('build', 'should pass');
			assert.equal(logs.length, 1);
		});

		it('allows error when level is warn', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'warn',
				format: 'default',
			});
			logger.error('build', 'should pass');
			assert.equal(logs.length, 1);
		});

		it('filters everything when level is silent', () => {
			const logger = new AstroLogger({
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
