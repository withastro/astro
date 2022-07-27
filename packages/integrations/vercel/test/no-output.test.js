import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Missing output config', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/no-output/',
		});
	});

	it('throws during the build', async () => {
		let error = undefined;
		try {
			await fixture.build();
		} catch(err) {
			error = err;
		}
		expect(error).to.not.be.equal(undefined);
		expect(error.message).to.include(`output: "server"`);
	});
});

