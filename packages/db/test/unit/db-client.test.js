import assert from 'node:assert';
import test, { describe } from 'node:test';
import { parseLibSQLConfig } from '../../dist/core/db-client/utils.js';

describe('db client config', () => {
	test('parse config options from URL (docs example url)', () => {
		const remoteURLToParse = new URL(
			'file://local-copy.db?encryptionKey=your-encryption-key&syncInterval=60&syncUrl=libsql%3A%2F%2Fyour.server.io',
		);
		const options = Object.fromEntries(remoteURLToParse.searchParams.entries());

		const config = parseLibSQLConfig(options);

		assert.deepEqual(config, {
			encryptionKey: 'your-encryption-key',
			syncInterval: 60,
			syncUrl: 'libsql://your.server.io',
		});
	});

	test('parse config options from URL (test booleans without value)', () => {
		const remoteURLToParse = new URL('file://local-copy.db?readYourWrites&offline&tls');
		const options = Object.fromEntries(remoteURLToParse.searchParams.entries());

		const config = parseLibSQLConfig(options);

		assert.deepEqual(config, {
			readYourWrites: true,
			offline: true,
			tls: true,
		});
	});

	test('parse config options from URL (test booleans with value)', () => {
		const remoteURLToParse = new URL(
			'file://local-copy.db?readYourWrites=true&offline=true&tls=true',
		);
		const options = Object.fromEntries(remoteURLToParse.searchParams.entries());

		const config = parseLibSQLConfig(options);

		assert.deepEqual(config, {
			readYourWrites: true,
			offline: true,
			tls: true,
		});
	});

	test('parse config options from URL (test numbers)', () => {
		const remoteURLToParse = new URL('file://local-copy.db?syncInterval=60&concurrency=2');
		const options = Object.fromEntries(remoteURLToParse.searchParams.entries());

		const config = parseLibSQLConfig(options);

		assert.deepEqual(config, {
			syncInterval: 60,
			concurrency: 2,
		});
	});
});
