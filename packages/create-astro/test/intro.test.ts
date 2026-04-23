import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { intro } from '../dist/index.js';
import { type IntroContext, setup } from './test-utils.ts';

describe('intro', () => {
	const fixture = setup();

	it('no arguments', async () => {
		const context: IntroContext = {
			skipHouston: false,
			version: Promise.resolve('0.0.0'),
			username: Promise.resolve('user'),
		};
		await intro(context);
		assert.ok(fixture.hasMessage('Houston:'));
		assert.ok(fixture.hasMessage('Welcome to  astro  v0.0.0'));
	});
	it('--skip-houston', async () => {
		const context: IntroContext = {
			skipHouston: true,
			version: Promise.resolve('0.0.0'),
			username: Promise.resolve('user'),
		};
		await intro(context);
		assert.equal(fixture.length(), 1);
		assert.ok(!fixture.hasMessage('Houston:'));
		assert.ok(fixture.hasMessage('Launch sequence initiated'));
	});
});
