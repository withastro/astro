import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../astro/test/test-utils.js';
import { cli } from '../dist/core/cli/index.js';
import { setupRemoteDb } from './test-utils.js';

const foreignKeyConstraintError = 'LibsqlError: SQLITE_CONSTRAINT: FOREIGN KEY constraint failed';

describe('astro:db - error handling', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/error-handling/', import.meta.url),
		});
	});

	it('Errors on invalid --db-app-token input', async () => {
		const originalExit = process.exit;
		const originalError = console.error;
		/** @type {string[]} */
		const errorMessages = [];
		console.error = (...args) => {
			errorMessages.push(args.map(String).join(' '));
		};
		process.exit = (code) => {
			throw new Error(`EXIT_${code}`);
		};

		try {
			await cli({
				config: fixture.config,
				flags: {
					_: [undefined, 'astro', 'db', 'verify'],
					dbAppToken: true,
				},
			});
			assert.fail('Expected command to exit');
		} catch (err) {
			assert.match(String(err), /EXIT_1/);
			assert.ok(
				errorMessages.some((m) => m.includes('Invalid value for --db-app-token')),
				`Expected error output to mention invalid --db-app-token, got: ${errorMessages.join('\n')}`,
			);
		} finally {
			process.exit = originalExit;
			console.error = originalError;
		}
	});

	describe('development', () => {
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('Raises foreign key constraint LibsqlError', async () => {
			const json = await fixture.fetch('/foreign-key-constraint.json').then((res) => res.json());
			assert.deepEqual(json, {
				message: foreignKeyConstraintError,
				code: 'SQLITE_CONSTRAINT',
			});
		});
	});

	describe('build --remote', () => {
		let remoteDbServer;

		before(async () => {
			remoteDbServer = await setupRemoteDb(fixture.config);
			await fixture.build();
		});

		after(async () => {
			await remoteDbServer?.stop();
		});

		it('Raises foreign key constraint LibsqlError', async () => {
			const json = await fixture.readFile('/foreign-key-constraint.json');
			assert.deepEqual(JSON.parse(json), {
				message: foreignKeyConstraintError,
				code: 'SQLITE_CONSTRAINT',
			});
		});
	});
});
