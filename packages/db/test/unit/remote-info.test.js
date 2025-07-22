import assert from 'node:assert';
import test, { beforeEach, describe } from 'node:test';
import { getRemoteDatabaseInfo } from '../../dist/core/utils.js';
import { clearEnvironment } from '../test-utils.js';

describe('RemoteDatabaseInfo', () => {
	beforeEach(() => {
		clearEnvironment();
	});

	test('default remote info', () => {
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			url: undefined,
			token: undefined,
		});
	});

	test('configured libSQL remote', () => {
		process.env.ASTRO_DB_REMOTE_URL = 'libsql://libsql.self.hosted';
		process.env.ASTRO_DB_APP_TOKEN = 'foo';
		const dbInfo = getRemoteDatabaseInfo();

		assert.deepEqual(dbInfo, {
			url: 'libsql://libsql.self.hosted',
			token: 'foo',
		});
	});
});
