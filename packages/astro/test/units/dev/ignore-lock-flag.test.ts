import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	dev,
	isIgnoreLock,
	getBackgroundIgnoreLockConflict,
	getForceIgnoreLockConflict,
} from '../../../dist/cli/dev/index.js';

// #region isIgnoreLock
describe('isIgnoreLock', () => {
	it('returns true when flags.ignoreLock is true (from --ignore-lock)', () => {
		assert.equal(isIgnoreLock({ _: [], ignoreLock: true }), true);
	});

	it('returns false when flags.ignoreLock is undefined (flag not passed)', () => {
		assert.equal(isIgnoreLock({ _: [], ignoreLock: undefined }), false);
	});

	it('returns false when flags.ignoreLock is false', () => {
		assert.equal(isIgnoreLock({ _: [], ignoreLock: false }), false);
	});
});
// #endregion

// #region getBackgroundIgnoreLockConflict
describe('getBackgroundIgnoreLockConflict', () => {
	it('returns null when --background is not set', () => {
		assert.equal(getBackgroundIgnoreLockConflict({ _: [], background: false }), null);
	});

	it('returns a conflict message when --background is explicit', () => {
		const message = getBackgroundIgnoreLockConflict({ _: [], background: true });
		assert.notEqual(message, null);
		assert.match(message!, /`--background`/);
		assert.match(message!, /cannot be used together/);
	});

	it('mentions astro dev stop/status/logs', () => {
		const message = getBackgroundIgnoreLockConflict({ _: [], background: true });
		assert.match(message!, /astro dev stop/);
		assert.match(message!, /astro dev status/);
		assert.match(message!, /astro dev logs/);
	});
});
// #endregion

// #region getForceIgnoreLockConflict
describe('getForceIgnoreLockConflict', () => {
	it('returns null when --force is not set', () => {
		assert.equal(getForceIgnoreLockConflict({ _: [], force: false }), null);
	});

	it('returns null when --force is undefined', () => {
		assert.equal(getForceIgnoreLockConflict({ _: [], force: undefined }), null);
	});

	it('returns a conflict message when --force is set', () => {
		const message = getForceIgnoreLockConflict({ _: [], force: true });
		assert.notEqual(message, null);
		assert.match(message!, /`--force`/);
		assert.match(message!, /`--ignore-lock`/);
		assert.match(message!, /cannot be used together/);
	});
});
// #endregion

describe('astro dev --ignore-lock with agent detection', () => {
	it('starts a foreground server when an AI agent is detected, instead of refusing', async () => {
		process.env.CLAUDECODE = '1';
		try {
			const server = await dev({
				flags: {
					_: ['', '', 'dev'],
					ignoreLock: true,
					port: 4734,
					root: './test/fixtures/astro-preview-allowed-hosts/',
					silent: true,
				},
			});
			assert.ok(server, 'expected the dev server to start in the foreground');
			try {
				assert.ok(server.resolvedUrls, 'expected the dev server to expose a URL');
				const response = await fetch('http://localhost:4734/');
				assert.equal(response.status, 200);
			} finally {
				await server.stop();
			}
		} finally {
			delete process.env.CLAUDECODE;
		}
	});
});
