import { describe, test, expect } from 'vitest'

import { intro } from '../src/actions/intro.js';
import { setup } from './utils.js';

describe('intro', () => {
	const fixture = setup();

	test('no arguments', async () => {
		await intro({ skipHouston: false, version: '0.0.0', username: 'user' });
		expect(fixture.hasMessage('Houston:')).toBeTruthy();
		expect(fixture.hasMessage('Welcome to  astro  v0.0.0')).toBeTruthy();
	}, 10000)
	test('--skip-houston', async () => {
		await intro({ skipHouston: true, version: '0.0.0', username: 'user' });
		expect(fixture.length()).toBe(1);
		expect(fixture.hasMessage('Houston:')).toBeFalsy();
		expect(fixture.hasMessage('Launch sequence initiated')).toBeTruthy();
	})
})
