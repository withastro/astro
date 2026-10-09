import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PORTABLE_SESSION_BASE_FLAG, resolveSessionBase } from '../../dist/shared.js';

const rootDir = new URL('file:///deploy/app/');

describe('resolveSessionBase', () => {
	it('resolves the adapter-injected base against the root directory', () => {
		const sessionConfig = {
			driver: 'unstorage/drivers/fs-lite',
			options: {
				base: 'node_modules/.astro/sessions',
				[PORTABLE_SESSION_BASE_FLAG]: true,
			},
		};

		resolveSessionBase(sessionConfig, rootDir);

		assert.equal(
			sessionConfig.options.base,
			fileURLToPath(new URL('node_modules/.astro/sessions', rootDir)),
		);
		assert.equal(PORTABLE_SESSION_BASE_FLAG in sessionConfig.options, false);
	});

	it('leaves the base of a user-configured key-value driver untouched', () => {
		const sessionConfig = {
			driver: 'unstorage/drivers/redis',
			options: { base: 'sessions' },
		};

		resolveSessionBase(sessionConfig, rootDir);

		assert.equal(sessionConfig.options.base, 'sessions');
	});

	it('leaves the base of a user-configured fs driver untouched', () => {
		const sessionConfig = {
			driver: 'unstorage/drivers/fs-lite',
			options: { base: 'custom/sessions' },
		};

		resolveSessionBase(sessionConfig, rootDir);

		assert.equal(sessionConfig.options.base, 'custom/sessions');
	});

	it('leaves an absolute base untouched', () => {
		const sessionConfig = {
			driver: 'unstorage/drivers/fs-lite',
			options: {
				base: '/var/lib/app/sessions',
				[PORTABLE_SESSION_BASE_FLAG]: true,
			},
		};

		resolveSessionBase(sessionConfig, rootDir);

		assert.equal(sessionConfig.options.base, '/var/lib/app/sessions');
	});

	it('does nothing when there is no session config', () => {
		assert.doesNotThrow(() => resolveSessionBase(undefined, rootDir));
	});
});
