import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	isNoLock,
	getBackgroundNoLockConflict,
	getForceNoLockConflict,
} from '../../../dist/cli/dev/index.js';

// #region isNoLock
describe('isNoLock', () => {
	it('returns true when flags.lock is false (from --no-lock)', () => {
		assert.equal(isNoLock({ lock: false }), true);
	});

	it('returns false when flags.lock is undefined (flag not passed)', () => {
		assert.equal(isNoLock({ lock: undefined }), false);
	});

	it('returns false when flags.lock is true', () => {
		assert.equal(isNoLock({ lock: true }), false);
	});
});
// #endregion

// #region getBackgroundNoLockConflict
describe('getBackgroundNoLockConflict', () => {
	it('returns null when background mode is not requested', () => {
		assert.equal(getBackgroundNoLockConflict({ background: false }, false), null);
	});

	it('returns a conflict message when --background is explicit', () => {
		const message = getBackgroundNoLockConflict({ background: true }, true);
		assert.notEqual(message, null);
		assert.match(message!, /`--background`/);
		assert.match(message!, /cannot be used together/);
	});

	it('returns a conflict message when background is only implied by agent detection', () => {
		const message = getBackgroundNoLockConflict({ background: false }, true);
		assert.notEqual(message, null);
		assert.match(message!, /auto-detected AI agent environment/);
		assert.doesNotMatch(message!, /`--background`/);
	});

	it('mentions astro dev stop/status/logs', () => {
		const message = getBackgroundNoLockConflict({ background: true }, true);
		assert.match(message!, /astro dev stop/);
		assert.match(message!, /astro dev status/);
		assert.match(message!, /astro dev logs/);
	});
});
// #endregion

// #region getForceNoLockConflict
describe('getForceNoLockConflict', () => {
	it('returns null when --force is not set', () => {
		assert.equal(getForceNoLockConflict({ force: false }), null);
	});

	it('returns null when --force is undefined', () => {
		assert.equal(getForceNoLockConflict({ force: undefined }), null);
	});

	it('returns a conflict message when --force is set', () => {
		const message = getForceNoLockConflict({ force: true });
		assert.notEqual(message, null);
		assert.match(message!, /`--force`/);
		assert.match(message!, /`--no-lock`/);
		assert.match(message!, /cannot be used together/);
	});
});
// #endregion
