import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

let fixture;

const errorMessage =
	'The <Picture> component requires you provide alt text. If this picture does not require an accessible label, set alt="".';

/** TODO: enable the test once missing alt text throws an error instead of a console warning */
describe.skip('SSG picture without alt text', function () {
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/no-alt-text-picture/' });
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
