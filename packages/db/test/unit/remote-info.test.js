import assert from 'node:assert';
import test, { after, beforeEach, describe } from 'node:test';
import { getManagedRemoteToken, getRemoteDatabaseInfo } from '../../dist/core/utils.js';
import { clearEnvironment } from '../test-utils.js';

describe('RemoteDatabaseInfo', () => {
	beforeEach(() => {
		clearEnvironment();
	});

	// TODO: what should be the default url for libsql?
	test('default remote info', () => {
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: 'studio',
			url: 'https://db.services.astro.build',
		});
	});

	test('configured libSQL remote', () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: 'libsql',
			url: 'libsql://libsql.self.hosted',
		});
	});
});

describe('RemoteManagedToken', () => {
	// Avoid conflicts with other tests
	beforeEach(() => {
		clearEnvironment();
		process.env.ASTRO_DB_APP_TOKEN = 'db token';
	});
	after(() => {
		clearEnvironment();
	});

	test('given token for default remote', async () => {
		const { token } = await getManagedRemoteToken('given token');
		assert.equal(token, 'given token');
	});

	test('token for default remote', async () => {
		const { token } = await getManagedRemoteToken();

		assert.equal(token, 'db token');
	});

	test('given token for configured libSQL remote', async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		const { token } = await getManagedRemoteToken('given token');
		assert.equal(token, 'given token');
	});

	test('token for configured libSQL remote', async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		const { token } = await getManagedRemoteToken();

		assert.equal(token, 'db token');
	});

	test('token for given libSQL remote', async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		const { token } = await getManagedRemoteToken(undefined, {
			type: 'libsql',
			url: 'libsql://libsql.self.hosted',
		});

		assert.equal(token, 'db token');
	});
});
