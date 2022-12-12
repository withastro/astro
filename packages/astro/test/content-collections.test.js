import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Content Collections', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collections/' });
		await fixture.build();
	});

	it('Builds', () => {
		expect(true).to.equal(true, 'Failed to build.');
	});

	it('Returns collection with sorted IDs', async () => {
		const rawJson = await fixture.readFile('/collection.json');
		const json = JSON.parse(rawJson);

		expect(Array.isArray(json)).to.equal(true);
		const ids = json.map((item) => item.id);
		expect(ids).to.deep.equal([
			'columbia.md',
			'endeavour.md',
			'enterprise.md',
			'promo/launch-week.mdx',
		]);
	});

	it('Returns entry', async () => {
		const rawJson = await fixture.readFile('/entry-columbia.json');
		const json = JSON.parse(rawJson);

		expect(json).to.haveOwnProperty('id');
		expect(json.id).to.equal('columbia.md');
	});
});
