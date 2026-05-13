import * as assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { AstroLoggerMessage, AstroLoggerDestination } from '../../../dist/core/logger/core.js';
import { AstroLogger } from '../../../dist/core/logger/core.js';
import jsonFactory, { SGR_REGEX } from '../../../dist/core/logger/impls/json.js';

let logs: AstroLoggerMessage[] = [];

const testDestination: AstroLoggerDestination<AstroLoggerMessage> = {
	write(event: AstroLoggerMessage) {
		logs.push(event);
	},
};

describe('log destination', () => {
	beforeEach(() => {
		logs = [];
	});

	describe('event shape', () => {
		const logger = new AstroLogger({
			destination: testDestination,
			level: 'info',
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

	describe('level filtering', () => {
		it('filters out info when level is warn', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'warn',
			});
			logger.info('build', 'should be filtered');
			assert.equal(logs.length, 0);
		});

		it('allows warn when level is warn', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'warn',
			});
			logger.warn('build', 'should pass');
			assert.equal(logs.length, 1);
		});

		it('allows error when level is warn', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'warn',
			});
			logger.error('build', 'should pass');
			assert.equal(logs.length, 1);
		});

		it('filters everything when level is silent', () => {
			const logger = new AstroLogger({
				destination: testDestination,
				level: 'silent',
			});
			logger.info('build', 'nope');
			logger.warn('build', 'nope');
			logger.error('build', 'nope');
			assert.equal(logs.length, 0);
		});
	});
});

describe('SGR_REGEX', () => {
	it('strips a single SGR sequence', () => {
		assert.equal('hello'.replace(SGR_REGEX, ''), 'hello');
		assert.equal('\x1b[31mhello\x1b[0m'.replace(SGR_REGEX, ''), 'hello');
	});

	it('strips bold, dim, italic, and other multi-param sequences', () => {
		assert.equal('\x1b[1;31mbold red\x1b[0m'.replace(SGR_REGEX, ''), 'bold red');
		assert.equal('\x1b[2mfaded\x1b[22m'.replace(SGR_REGEX, ''), 'faded');
	});

	it('strips reset-only sequence', () => {
		assert.equal('\x1b[0m'.replace(SGR_REGEX, ''), '');
		assert.equal('\x1b[m'.replace(SGR_REGEX, ''), '');
	});

	it('strips multiple SGR sequences in one string', () => {
		const input = '\x1b[32mgreen\x1b[39m and \x1b[34mblue\x1b[39m';
		assert.equal(input.replace(SGR_REGEX, ''), 'green and blue');
	});

	it('leaves plain text untouched', () => {
		assert.equal('no codes here'.replace(SGR_REGEX, ''), 'no codes here');
		assert.equal(''.replace(SGR_REGEX, ''), '');
	});

	it('does not strip non-SGR escape sequences', () => {
		// Cursor movement (CSI H) is not an SGR (does not end with 'm')
		const cursorMove = '\x1b[2J';
		assert.equal(cursorMove.replace(SGR_REGEX, ''), cursorMove);
	});

	it('is stateless across calls (global flag resets lastIndex)', () => {
		SGR_REGEX.lastIndex = 0;
		const a = '\x1b[31mred\x1b[0m'.replace(SGR_REGEX, '');
		const b = '\x1b[32mgreen\x1b[0m'.replace(SGR_REGEX, '');
		assert.equal(a, 'red');
		assert.equal(b, 'green');
	});
});

describe('json handler', () => {
	let stdoutWrites: string[];
	let stderrWrites: string[];
	let originalStdoutWrite: typeof process.stdout.write;
	let originalStderrWrite: typeof process.stderr.write;

	beforeEach(() => {
		stdoutWrites = [];
		stderrWrites = [];
		originalStdoutWrite = process.stdout.write;
		originalStderrWrite = process.stderr.write;
		process.stdout.write = ((chunk: string) => {
			stdoutWrites.push(chunk);
			return true;
		}) as typeof process.stdout.write;
		process.stderr.write = ((chunk: string) => {
			stderrWrites.push(chunk);
			return true;
		}) as typeof process.stderr.write;
	});

	afterEach(() => {
		process.stdout.write = originalStdoutWrite;
		process.stderr.write = originalStderrWrite;
	});

	describe('output format', () => {
		const destination = jsonFactory({ pretty: false });
		const logger = new AstroLogger({
			destination,
			level: 'info',
		});

		it('writes JSON with message and label', () => {
			logger.info('build', 'compiled successfully');
			assert.equal(stdoutWrites.length, 1);
			assert.equal(
				stdoutWrites[0],
				'{"message":"compiled successfully","label":"build","level":"info"}\n',
			);
		});

		it('writes JSON with null label', () => {
			logger.info(null, 'no label message');
			assert.equal(stdoutWrites[0], '{"message":"no label message","label":null,"level":"info"}\n');
		});

		it('includes message, label and level in output', () => {
			logger.warn('build', 'a warning');
			assert.equal(stdoutWrites[0], '{"message":"a warning","label":"build","level":"warn"}\n');
		});

		it('strips ANSI codes from messages', () => {
			logger.info('build', '\x1b[32mgreen text\x1b[39m');
			assert.equal(stdoutWrites[0], '{"message":"green text","label":"build","level":"info"}\n');
		});
	});

	describe('pretty mode', () => {
		const destination = jsonFactory({ pretty: true });
		const logger = new AstroLogger({
			destination,
			level: 'info',
		});

		it('writes indented JSON when pretty is true', () => {
			logger.info('build', 'test');
			const parsed = JSON.parse(stdoutWrites[0]);
			assert.equal(parsed.message, 'test');
			assert.equal(parsed.label, 'build');
			assert.ok(stdoutWrites[0].includes('\n  '), 'output should be indented');
		});
	});

	describe('stream routing', () => {
		const destination = jsonFactory({ pretty: false });
		const logger = new AstroLogger({
			destination,
			level: 'info',
		});

		it('routes info to stdout', () => {
			logger.info('build', 'test');
			assert.equal(stdoutWrites.length, 1);
			assert.equal(stderrWrites.length, 0);
		});

		it('routes warn to stdout', () => {
			logger.warn('build', 'test');
			assert.equal(stdoutWrites.length, 1);
			assert.equal(stderrWrites.length, 0);
		});

		it('routes error to stderr', () => {
			logger.error('build', 'test');
			assert.equal(stdoutWrites.length, 0);
			assert.equal(stderrWrites.length, 1);
		});
	});
});
