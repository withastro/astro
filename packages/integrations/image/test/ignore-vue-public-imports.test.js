import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Image integration with vue integration', async () => {
	let fixture;
	let error = null;
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ignore-vue-public-imports/',
		});
		try {
			await fixture.build();
		} catch (e) {
			error = e;
		}
	});
	it('Builds without throwing', async () => {
		expect(error).to.equal(null);
	});
});
