import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Type Imports', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: new URL('./fixtures/type-imports', import.meta.url) });
		await fixture.build();
	});

	it('Allows importing types from "astro"', async () => {
		// if the build passes then the test succeeds
		expect(true).to.be.true;
	});
});
