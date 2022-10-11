import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('getImage', function () {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/get-image-remote/' });
		await fixture.build();
	});

	it('Remote images works', async () => {
		const assets = await fixture.readdir('/assets');
		expect(assets).to.have.a.lengthOf(1);
	});
});
