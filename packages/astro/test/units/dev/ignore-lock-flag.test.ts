import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
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
	it('returns null when background mode is not requested', () => {
		assert.equal(getBackgroundIgnoreLockConflict({ _: [], background: false }, false), null);
	});

	it('returns a conflict message when --background is explicit', () => {
		const message = getBackgroundIgnoreLockConflict({ _: [], background: true }, true);
		assert.notEqual(message, null);
		assert.match(message!, /`--background`/);
		assert.match(message!, /cannot be used together/);
	});

	it('returns a conflict message when background is only implied by agent detection', () => {
		const message = getBackgroundIgnoreLockConflict({ _: [], background: false }, true);
		assert.notEqual(message, null);
		assert.match(message!, /auto-detected AI agent environment/);
		assert.doesNotMatch(message!, /`--background`/);
	});

	it('mentions astro dev stop/status/logs', () => {
		const message = getBackgroundIgnoreLockConflict({ _: [], background: true }, true);
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
