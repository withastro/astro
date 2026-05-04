import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('custom the assets name function', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/custom-assets-name/',
			output: 'server',
		});
		await fixture.build();
	});

	it('It cant find this file cause the node throws an error if the users custom a path that includes the folder path', async () => {
		const csslength = await fixture.readFile('client/assets/css/a.css');
		assert.equal(!!csslength, true);
	});
});
