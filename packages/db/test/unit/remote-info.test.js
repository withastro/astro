import test, { after, beforeEach, describe } from "node:test";
import assert from "node:assert";
import { getRemoteDatabaseInfo, getManagedRemoteToken } from '../../dist/core/utils.js';
import { clearEnvironment } from "../test-utils.js";

describe('RemoteDatabaseInfo', () => {
	beforeEach(() => {
		clearEnvironment();
	});

	test('default remote info', () => {
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: 'studio',
			url: 'https://db.services.astro.build',
		});
	});

	test('configured Astro Studio remote', () => {
		process.env.ASTRO_STUDIO_REMOTE_DB_URL = 'https://studio.astro.build';
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: 'studio',
			url: 'https://studio.astro.build',
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

	test('configured both libSQL and Studio remote', () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		process.env.ASTRO_STUDIO_REMOTE_DB_URL = 'https://studio.astro.build';
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			type: 'studio',
			url: 'https://studio.astro.build',
		});
	});
});

describe('RemoteManagedToken', () => {
	// Avoid conflicts with other tests
	beforeEach(() => { clearEnvironment(); });
	after(() => { clearEnvironment(); });

	test('given token for default remote', async () => {
		const { token } = await getManagedRemoteToken('some token');
		assert.equal(token, 'some token');
	});

	test('token for default remote', async () => {
		process.env.ASTRO_STUDIO_APP_TOKEN = 'some token'
		const { token } = await getManagedRemoteToken();

		assert.equal(token, 'some token');
	});

	test('given token for configured Astro Studio remote', async () => {
		process.env.ASTRO_STUDIO_REMOTE_DB_URL = 'https://studio.astro.build';
		const { token } = await getManagedRemoteToken('some token');
		assert.equal(token, 'some token');
	});

	test('token for configured Astro Studio remote', async () => {
		process.env.ASTRO_STUDIO_REMOTE_DB_URL = 'https://studio.astro.build';
		process.env.ASTRO_STUDIO_APP_TOKEN = 'some token'
		const { token } = await getManagedRemoteToken();

		assert.equal(token, 'some token');
	});

	test('given token for configured libSQL remote', async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		const { token } = await getManagedRemoteToken('some token');
		assert.equal(token, 'some token');
	});

	test('token for configured libSQL remote', async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		process.env.ASTRO_DB_APP_TOKEN = 'some token'
		const { token } = await getManagedRemoteToken();

		assert.equal(token, 'some token');
	});

	test('token for given Astro Studio remote', async () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		process.env.ASTRO_STUDIO_APP_TOKEN = 'some token'
		const { token } = await getManagedRemoteToken(undefined, {
			type: 'studio',
			url: 'https://studio.astro.build',
		});

		assert.equal(token, 'some token');
	});

	test('token for given libSQL remote', async () => {
		process.env.ASTRO_STUDIO_REMOTE_URL = 'libsql://libsql.self.hosted';
		process.env.ASTRO_DB_APP_TOKEN = 'some token'
		const { token } = await getManagedRemoteToken(undefined, {
			type: 'libsql',
			url: 'libsql://libsql.self.hosted',
		});

		assert.equal(token, 'some token');
	});
});
