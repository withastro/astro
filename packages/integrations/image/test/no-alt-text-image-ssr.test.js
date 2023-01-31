import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from '../../../astro/test/test-adapter.js';

let fixture;

const errorMessage =
	'The <Image> component requires you provide alt text. If this image does not require an accessible label, set alt="".';

/** TODO: enable the test once missing alt text throws an error instead of a console warning */
describe.skip('SSR image without alt text', function () {
	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/no-alt-text-image/',
			adapter: testAdapter({ streaming: false }),
			output: 'server',
		});
		await fixture.build();
	});

	it('throws during build', async () => {
		try {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			await response.text();
		} catch (err) {
			expect(err.message).to.equal(errorMessage);
			return;
		}
		expect.fail(0, 1, 'Exception not thrown');
	});
});
