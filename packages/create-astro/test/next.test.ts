import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { next } from '../dist/index.js';
import { type NextContext, setup } from './test-utils.ts';

describe('next steps', () => {
	const fixture = setup();

	it('no arguments', async () => {
		const context: NextContext = {
			skipHouston: false,
			cwd: './it/fixtures/not-empty',
			packageManager: 'npm',
		};
		await next(context);
		assert.ok(fixture.hasMessage('Liftoff confirmed.'));
		assert.ok(fixture.hasMessage('npm run dev'));
		assert.ok(fixture.hasMessage('Good luck out there, astronaut!'));
	});

	it('--skip-houston', async () => {
		const context: NextContext = {
			skipHouston: true,
			cwd: './it/fixtures/not-empty',
			packageManager: 'npm',
		};
		await next(context);
		assert.ok(!fixture.hasMessage('Good luck out there, astronaut!'));
	});
});
