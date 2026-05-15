import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture, type RemoteDbServer, setupRemoteDb } from './test-utils.ts';
import { cli } from '../dist/core/cli/index.js';

const foreignKeyConstraintError = 'LibsqlError: SQLITE_CONSTRAINT: FOREIGN KEY constraint failed';

describe('astro:db - error handling', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/error-handling/', import.meta.url),
		});
	});

	it('Errors on invalid --db-app-token input', async () => {
		const originalExit = process.exit;
		const originalError = console.error;
		const errorMessages: string[] = [];
		console.error = (...args: unknown[]) => {
			errorMessages.push(args.map(String).join(' '));
		};
		process.exit = ((code?: number) => {
			throw new Error(`EXIT_${code}`);
		}) as typeof process.exit;

		try {
			await cli({
				config: fixture.config,
				flags: {
					_: ['', 'astro', 'db', 'verify'],
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

	describe('build --remote', () => {
		let remoteDbServer: RemoteDbServer;

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
