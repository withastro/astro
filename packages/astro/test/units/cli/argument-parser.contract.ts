import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CliArgumentParser } from '../../../dist/cli/definitions.js';

export function cliArgumentParserContract(parser: CliArgumentParser) {
	describe('CLI argument parser contract', () => {
		it('preserves command and subcommand positionals', () => {
			assert.deepEqual(parser.parse(['dev', 'logs', '--follow']), {
				_: ['dev', 'logs'],
				follow: true,
			});
			assert.deepEqual(parser.parse(['/usr/bin/node', '/app/astro.mjs', 'dev']), {
				_: ['/usr/bin/node', '/app/astro.mjs', 'dev'],
			});
		});

		it('parses boolean, short, and negated flags', () => {
			assert.deepEqual(parser.parse(['-g', '-h', '-y', '--no-json']), {
				_: [],
				global: true,
				h: true,
				y: true,
				json: false,
				g: true,
			});
		});

		it('camel-cases dashed flags and preserves mixed-case flags', () => {
			assert.deepEqual(parser.parse(['dev', '--ignore-lock', '--out-dir=dist', '--noSync']), {
				_: ['dev'],
				ignoreLock: true,
				outDir: 'dist',
				noSync: true,
			});
		});

		it('parses string and numeric option values before and after positionals', () => {
			assert.deepEqual(parser.parse(['--root', 'site', 'dev', '--port', '4321']), {
				_: ['dev'],
				root: 'site',
				port: 4321,
			});
			assert.deepEqual(parser.parse(['dev', '--port', '-1']), {
				_: ['dev'],
				port: -1,
			});
		});

		it('collects repeated string options into arrays', () => {
			assert.deepEqual(parser.parse(['dev', '--root', 'first', '--root', 'second']), {
				_: ['dev'],
				root: ['first', 'second'],
			});
		});

		it('supports flags that accept either a value or no value', () => {
			assert.deepEqual(parser.parse(['dev', '--host', '--open', '--allowed-hosts']), {
				_: ['dev'],
				host: true,
				open: true,
				allowedHosts: true,
			});
			assert.deepEqual(parser.parse(['dev', '--host', '127.0.0.1', '--open', 'docs']), {
				_: ['dev'],
				host: '127.0.0.1',
				open: 'docs',
			});
		});

		it('accepts unknown options and their values', () => {
			assert.deepEqual(parser.parse(['add', '--custom-value', 'value', 'integration']), {
				_: ['add', 'integration'],
				customValue: 'value',
			});
			assert.deepEqual(parser.parse(['dev', '--custom-value', '123']), {
				_: ['dev'],
				customValue: 123,
			});
		});

		it('treats arguments after the delimiter as positionals', () => {
			assert.deepEqual(parser.parse(['dev', '--', '--root', 'site']), {
				_: ['dev', '--root', 'site'],
			});
			assert.deepEqual(parser.parse(['dev', '--', '--port', '-1']), {
				_: ['dev', '--port', '-1'],
			});
		});

		it('does not consume another option when a value is omitted', () => {
			assert.deepEqual(parser.parse(['dev', '--root', '--force']), {
				_: ['dev'],
				root: true,
				force: true,
			});
		});
	});
}
