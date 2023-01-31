import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

const errorMessage =
	'The <Image> component requires you provide alt text. If this image does not require an accessible label, set alt="".';

/** TODO: enable the test once missing alt text throws an error instead of a console warning */
describe.skip('SSG image without alt text', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/no-alt-text-image/' });
	});

	it('throws during build', async () => {
		try {
			await fixture.build();
		} catch (err) {
			expect(err.message).to.equal(errorMessage);
			return;
		}
		expect.fail(0, 1, 'Exception not thrown');
	});
});
