import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { verify } from '../dist/index.js';
import { mockExit, setup, type VerifyContext } from './test-utils.ts';

describe('verify', async () => {
	const fixture = setup();
	const baseContext = {
		version: Promise.resolve('0.0.0'),
		ref: 'latest',
		exit: mockExit,
	} satisfies Partial<VerifyContext>;

	it('basics', async () => {
		const context: VerifyContext = { ...baseContext, template: 'basics' };
		await verify(context);
		assert.equal(fixture.messages().length, 0, 'Did not expect `verify` to log any messages');
	});

	it('missing', async () => {
		const context: VerifyContext = { ...baseContext, template: 'missing' };
		let err = null;
		try {
			await verify(context);
		} catch (e) {
			err = e;
		}
		assert.equal(err, 1);
		assert.ok(!fixture.hasMessage('Template missing does not exist!'));
	});

	it('starlight', async () => {
		const context: VerifyContext = { ...baseContext, template: 'starlight' };
		await verify(context);
		assert.equal(fixture.messages().length, 0, 'Did not expect `verify` to log any messages');
	});

	it('starlight/tailwind', async () => {
		const context: VerifyContext = { ...baseContext, template: 'starlight/tailwind' };
		await verify(context);
		assert.equal(fixture.messages().length, 0, 'Did not expect `verify` to log any messages');
	});
});
