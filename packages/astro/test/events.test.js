import { expect } from 'chai';
import { AstroErrorCodes } from '../dist/core/errors.js';
import * as events from '../dist/events/index.js';

describe('Events', () => {
	describe('eventCliSession()', () => {
		it('All top-level keys added', () => {
			const config = {
				root: 1,
				srcDir: 2,
				publicDir: 3,
				outDir: 4,
				site: 5,
				base: 6,
				trailingSlash: 7,
				experimental: 8,
			};
			const expected = Object.keys(config);
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).to.deep.equal(expected);
		});

		it('configKeys includes format', () => {
			const config = {
				srcDir: 1,
				build: {
					format: 'file',
				},
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).to.deep.equal(['srcDir', 'build', 'build.format']);
		});

		it('config.build.format', () => {
			const config = {
				srcDir: 1,
				build: {
					format: 'file',
				},
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.config.build.format).to.equal('file');
		});

		it('configKeys includes server props', () => {
			const config = {
				srcDir: 1,
				server: {
					host: 'example.com',
					port: 8033,
				},
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).to.deep.equal(['srcDir', 'server', 'server.host', 'server.port']);
		});

		it('configKeys is deep', () => {
			const config = {
				publicDir: 1,
				markdown: {
					drafts: true,
					shikiConfig: {
						lang: 1,
						theme: 2,
						wrap: 3,
					},
					syntaxHighlight: 'shiki',
					remarkPlugins: [],
					rehypePlugins: [],
				},
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).to.deep.equal([
				'publicDir',
				'markdown',
				'markdown.drafts',
				'markdown.shikiConfig',
				'markdown.shikiConfig.lang',
				'markdown.shikiConfig.theme',
				'markdown.shikiConfig.wrap',
				'markdown.syntaxHighlight',
				'markdown.remarkPlugins',
				'markdown.rehypePlugins',
			]);
		});

		it('syntaxHighlight', () => {
			const config = {
				markdown: {
					syntaxHighlight: 'shiki',
				},
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.config.markdown.syntaxHighlight).to.equal('shiki');
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

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'root',
				'vite',
				'vite.css',
				'vite.css.modules',
				'vite.base',
				'vite.mode',
				'vite.define',
				'vite.publicDir',
			]);
		});

		it('vite.resolve keys are captured', async () => {
			const config = {
				vite: {
					resolve: {
						alias: {
							a: 'b',
						},
						dedupe: ['one', 'two'],
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.resolve',
				'vite.resolve.alias',
				'vite.resolve.dedupe',
			]);
		});

		it('vite.css keys are captured', async () => {
			const config = {
				vite: {
					resolve: {
						dedupe: ['one', 'two'],
					},
					css: {
						modules: [],
						postcss: {},
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.resolve',
				'vite.resolve.dedupe',
				'vite.css',
				'vite.css.modules',
				'vite.css.postcss',
			]);
		});

		it('vite.server keys are captured', async () => {
			const config = {
				vite: {
					server: {
						host: 'example.com',
						open: true,
						fs: {
							strict: true,
							allow: ['a', 'b'],
						},
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.server',
				'vite.server.host',
				'vite.server.open',
				'vite.server.fs',
				'vite.server.fs.strict',
				'vite.server.fs.allow',
			]);
		});

		it('vite.build keys are captured', async () => {
			const config = {
				vite: {
					build: {
						target: 'one',
						outDir: 'some/dir',
						cssTarget: {
							one: 'two',
						},
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.build',
				'vite.build.target',
				'vite.build.outDir',
				'vite.build.cssTarget',
			]);
		});

		it('vite.preview keys are captured', async () => {
			const config = {
				vite: {
					preview: {
						host: 'example.com',
						port: 8080,
						another: {
							a: 'b',
						},
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.preview',
				'vite.preview.host',
				'vite.preview.port',
				'vite.preview.another',
			]);
		});

		it('vite.optimizeDeps keys are captured', async () => {
			const config = {
				vite: {
					optimizeDeps: {
						entries: ['one', 'two'],
						exclude: ['secret', 'name'],
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.optimizeDeps',
				'vite.optimizeDeps.entries',
				'vite.optimizeDeps.exclude',
			]);
		});

		it('vite.ssr keys are captured', async () => {
			const config = {
				vite: {
					ssr: {
						external: ['a'],
						target: { one: 'two' },
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.ssr',
				'vite.ssr.external',
				'vite.ssr.target',
			]);
		});

		it('vite.worker keys are captured', async () => {
			const config = {
				vite: {
					worker: {
						format: { a: 'b' },
						plugins: ['a', 'b'],
					},
				},
			};

			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.configKeys).is.deep.equal([
				'vite',
				'vite.worker',
				'vite.worker.format',
				'vite.worker.plugins',
			]);
		});

		it('falsy integrations', () => {
			const config = {
				srcDir: 1,
				integrations: [null, undefined, false],
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config
			);
			expect(payload.config.integrations.length).to.equal(0);
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
				drafts: true,
			};
			const [{ payload }] = events.eventCliSession(
				{
					cliCommand: 'dev',
				},
				config,
				flags
			);
			expect(payload.flags).to.deep.equal([
				'root',
				'site',
				'host',
				'port',
				'config',
				'experimentalSsr',
				'experimentalIntegrations',
				'drafts',
			]);
		});
	});

	describe('eventConfigError()', () => {
		it('returns the expected event and payload', () => {
			const [event] = events.eventConfigError({
				err: { issues: [{ path: ['a', 'b', 'c'] }, { path: ['d', 'e', 'f'] }] },
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			expect(event).to.deep.equal({
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					code: AstroErrorCodes.ConfigError,
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
			const errorWithFullMetadata = new Error('TEST ERROR MESSAGE');
			errorWithFullMetadata.code = 1234;
			errorWithFullMetadata.plugin = 'TEST PLUGIN';
			const [event] = events.eventError({
				err: errorWithFullMetadata,
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			expect(event).to.deep.equal({
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					code: 1234,
					plugin: 'TEST PLUGIN',
					isFatal: true,
					cliCommand: 'COMMAND_NAME',
					anonymousMessageHint: 'TEST ERROR MESSAGE',
				},
			});
		});

		it('returns the expected event payload with a generic error', () => {
			const [event] = events.eventError({
				err: new Error('TEST ERROR MESSAGE'),
				cmd: 'COMMAND_NAME',
				isFatal: false,
			});
			expect(event).to.deep.equal({
				eventName: 'ASTRO_CLI_ERROR',
				payload: {
					code: AstroErrorCodes.UnknownError,
					plugin: undefined,
					isFatal: false,
					cliCommand: 'COMMAND_NAME',
					anonymousMessageHint: 'TEST ERROR MESSAGE',
				},
			});
		});

		it('properly creates anonymousMessageHint from a basic error message', () => {
			const [event] = events.eventError({
				err: new Error('TEST ERROR MESSAGE: Sensitive data is "/Users/MYNAME/foo.astro"'),
				cmd: 'COMMAND_NAME',
				isFatal: true,
			});
			expect(event.payload.anonymousMessageHint).to.equal('TEST ERROR MESSAGE');
		});
	});
});
