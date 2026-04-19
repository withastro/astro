import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ZodError } from 'zod';
import type { AstroUserConfig } from 'astro';
import type { ErrorWithMetadata } from '../dist/core/errors/errors.js';
import { AstroError } from '../dist/core/errors/errors.js';
import { ClientAddressNotAvailable } from '../dist/core/errors/errors-data.js';
import * as events from '../dist/events/index.js';

describe('Events', () => {
	describe('eventCliSession()', () => {
		it('string literal "build.format" is included', () => {
			const config = {
				build: {
					format: 'file',
				},
			};
			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig);
			assert.equal((payload.config!.build as Record<string, unknown>).format, 'file');
		});

		it('string literal "markdown.syntaxHighlight" is included', () => {
			const config = {
				markdown: {
					syntaxHighlight: 'shiki',
				},
			};
			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig);
			assert.equal((payload.config!.markdown as Record<string, unknown>).syntaxHighlight, 'shiki');
		});

		it('top-level vite keys are captured', async () => {
			const config = {
				root: 'some/thing',
				vite: {
					css: { modules: [] },
					base: 'a',
					mode: 'b',
					define: {
						a: 'b',
					},
					publicDir: 'some/dir',
				},
			};

			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig);
			assert.deepEqual(Object.keys(payload.config!.vite!), [
				'css',
				'base',
				'mode',
				'define',
				'publicDir',
			]);
		});

		it('falsy integrations are handled', () => {
			const config = {
				integrations: [null, undefined, false],
			};
			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig);
			assert.equal((payload.config!.integrations as string[]).length, 0);
		});

		it('only integration names are included', () => {
			const config = {
				integrations: [{ name: 'foo' }, [{ name: 'bar' }, { name: 'baz' }]],
			};
			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig);
			assert.deepEqual(payload.config!.integrations, ['foo', 'bar', 'baz']);
		});

		it('only adapter name is included', () => {
			const config = {
				adapter: { name: 'ADAPTER_NAME' },
			};
			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig);
			assert.equal(payload.config!.adapter, 'ADAPTER_NAME');
		});

		it('includes cli flags in payload', () => {
			const config = {};
			const flags = {
				root: 'root',
				site: 'http://example.com',
				host: true,
				port: 8080,
				config: 'path/to/config.mjs',
				experimentalSsr: true,
				experimentalIntegrations: true,
			};
			const [{ payload }] = events.eventCliSession('dev', config as AstroUserConfig, flags);
			assert.deepEqual(payload.flags, [
				'root',
				'site',
				'host',
				'port',
				'config',
				'experimentalSsr',
				'experimentalIntegrations',
			]);
		});
	});

	describe('eventConfigError()', () => {
		it('returns the expected event and payload', () => {
			const [event] = events.eventConfigError({
				err: new ZodError([
					{ code: 'custom', message: '', path: ['a', 'b', 'c'] },
					{ code: 'custom', message: '', path: ['d', 'e', 'f'] },
				]),
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			assert.deepEqual(event, {
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					name: 'ZodError',
					isFatal: true,
					isConfig: true,
					cliCommand: 'COMMAND_NAME',
					configErrorPaths: ['a.b.c', 'd.e.f'],
				},
			});
		});
	});

	describe('eventError()', () => {
		it('returns the expected event payload with a detailed error object', () => {
			const errorWithFullMetadata: ErrorWithMetadata = {
				name: 'Error',
				message: 'TEST ERROR MESSAGE',
				stack: '',
				code: 1234,
				plugin: 'TEST PLUGIN',
			};
			const [event] = events.eventError({
				err: errorWithFullMetadata,
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			assert.deepEqual(event, {
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					plugin: 'TEST PLUGIN',
					name: 'Error',
					isFatal: true,
					cliCommand: 'COMMAND_NAME',
					anonymousMessageHint: 'TEST ERROR MESSAGE',
				},
			});
		});

		it('returns the expected event payload for AstroError', () => {
			const [event] = events.eventError({
				err: new AstroError({
					...ClientAddressNotAvailable,
					message: ClientAddressNotAvailable.message('mysuperadapter'),
				}) as ErrorWithMetadata,
				cmd: 'COMMAND_NAME',
				isFatal: false,
			});

			assert.deepEqual(event, {
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					anonymousMessageHint:
						'`Astro.clientAddress` is not available in the `ADAPTER_NAME` adapter. File an issue with the adapter to add support.',
					cliCommand: 'COMMAND_NAME',
					isFatal: false,
					name: 'ClientAddressNotAvailable',
					plugin: undefined,
				},
			});
		});

		it('returns the expected event payload with a generic error', () => {
			const [event] = events.eventError({
				err: new Error('TEST ERROR MESSAGE') as ErrorWithMetadata,
				cmd: 'COMMAND_NAME',
				isFatal: false,
			});
			assert.deepEqual(event, {
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					name: 'Error',
					plugin: undefined,
					isFatal: false,
					cliCommand: 'COMMAND_NAME',
					anonymousMessageHint: 'TEST ERROR MESSAGE',
				},
			});
		});

		it('properly creates anonymousMessageHint from a basic error message', () => {
			const [event] = events.eventError({
				err: new Error('TEST ERROR MESSAGE: Sensitive data is "/Users/MYNAME/foo.astro"') as ErrorWithMetadata,
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			assert.equal(event.payload.anonymousMessageHint, 'TEST ERROR MESSAGE');
		});

		it('properly exclude stack traces from anonymousMessageHint', () => {
			// Some libraries/frameworks returns stack traces in the error message, make sure we don't include that in the anonymousMessageHint
			const [event] = events.eventError({
				err: new Error(`[postcss] /home/projects/github-ssfd5p/src/components/Counter.css:3:15: Missed semicolon
    at Input.error (file:///home/projects/github-ssfd5p/node_modules/postcss/lib/input.js:148:16)
    at Parser.checkMissedSemicolon (file:///home/projects/github-ssfd5p/node_modules/postcss/lib/parser.js:596:22)
    at Parser.decl (file:///home/projects/github-ssfd5p/node_modules/postcss/lib/parser.js:279:12)
    at Parser.other (file:///home/projects/github-ssfd5p/node_modules/postcss/lib/parser.js:128:18)
    at Parser.parse (file:///home/projects/github-ssfd5p/node_modules/postcss/lib/parser.js:72:16)`) as ErrorWithMetadata,
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			assert.equal(event.payload.anonymousMessageHint, undefined);
		});
	});
});
