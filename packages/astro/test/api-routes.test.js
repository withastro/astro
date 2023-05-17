import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/api-routes/' });
		await fixture.build();
	});

	describe('Binary data', () => {
		it('can be returned from a response', async () => {
			const dat = await fixture.readFile('/binary.dat', null);
			expect(dat.length).to.equal(1);
			expect(dat[0]).to.equal(0xff);
		});
	});
});
