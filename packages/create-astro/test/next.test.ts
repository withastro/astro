import { describe, test, expect } from 'vitest'
import path from 'node:path';
import { next } from '../src/actions/next-steps.js';
import { setup } from './utils.js';

describe('next steps', () => {
	const fixture = setup();

	test('no arguments', async () => {
		await next({ skipHouston: false, cwd: './test/fixtures/not-empty', pkgManager: 'npm' });
		expect(fixture.hasMessage('Liftoff confirmed.')).toBeTruthy();
		expect(fixture.hasMessage('npm run dev')).toBeTruthy();
		expect(fixture.hasMessage('Good luck out there, astronaut!')).toBeTruthy();
	}, 10000)

	test('--skip-houston', async () => {
		await next({ skipHouston: true, cwd: './test/fixtures/not-empty', pkgManager: 'npm' });
		expect(fixture.hasMessage('Good luck out there, astronaut!')).toBeFalsy();
	})
})
