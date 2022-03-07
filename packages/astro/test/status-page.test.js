import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

// Asset bundling
describe('Status Code Pages', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			projectRoot: './fixtures/status-code/',
		});
		await fixture.build();
	});

	it('builds to 404.html', async () => {
		const html = await fixture.readFile('/404.html');
		expect(html).to.be.ok;
	});
});
