import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('API routes', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/api-routes/' });
		await fixture.build();
	});

	describe('Binary data', () => {
		it('can be returned from a response', async () => {
			const dat = await fixture.readBuffer('/binary.dat');
			assert.equal(dat.length, 1);
			assert.equal(dat[0], 0xff);
		});
	});
});
