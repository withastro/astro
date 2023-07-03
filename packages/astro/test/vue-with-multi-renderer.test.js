import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Vue with multi-renderer', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/vue-with-multi-renderer/',
		});
	});

	it('builds with another renderer present', async () => {
		try {
			await fixture.build();
		} catch (e) {
			expect(e).to.equal(undefined, `Should not throw`);
		}
	});
});
