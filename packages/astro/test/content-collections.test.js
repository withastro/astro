import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import * as devalue from 'devalue';

describe('Content Collections', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-collections/' });
		await fixture.build();
	});

	it('Builds', () => {
		expect(true).to.equal(true, 'Failed to build.');
	});

	describe('Collection', () => {
		let json;
		before(async () => {
			const rawJson = await fixture.readFile('/collections.json');
			json = devalue.parse(rawJson);
		});
		it('Returns `without config` collection', async () => {
			expect(json).to.haveOwnProperty('withoutConfig');
			expect(Array.isArray(json.withoutConfig)).to.equal(true);

			const ids = json.withoutConfig.map((item) => item.id);
			expect(ids).to.deep.equal([
				'columbia.md',
				'endeavour.md',
				'enterprise.md',
				'promo/launch-week.mdx',
			]);
		});

		it('Returns `with schema` collection', async () => {
			expect(json).to.haveOwnProperty('withSchemaConfig');
			expect(Array.isArray(json.withSchemaConfig)).to.equal(true);

			const ids = json.withSchemaConfig.map((item) => item.id);
			const publishedDates = json.withSchemaConfig.map((item) => item.data.publishedAt);
			expect(ids).to.deep.equal(['one.md', 'three.md', 'two.md']);
			expect(publishedDates.every((date) => date instanceof Date)).to.equal(
				true,
				'Not all publishedAt dates are Date objects'
			);
			expect(publishedDates.map((date) => date.toISOString())).to.deep.equal([
				'2021-01-01T00:00:00.000Z',
				'2021-01-03T00:00:00.000Z',
				'2021-01-02T00:00:00.000Z',
			]);
		});

		it('Returns `with custom slugs` collection', async () => {
			expect(json).to.haveOwnProperty('withSlugConfig');
			expect(Array.isArray(json.withSlugConfig)).to.equal(true);

			const slugs = json.withSlugConfig.map((item) => item.slug);
			expect(slugs).to.deep.equal(['fancy-one.md', 'excellent-three.md', 'interesting-two.md']);
		});
	});

	describe('Entry', () => {
		let json;
		before(async () => {
			const rawJson = await fixture.readFile('/entries.json');
			json = devalue.parse(rawJson);
		});
		it('Returns without config collection entry', async () => {
			expect(json).to.haveOwnProperty('columbiaWithoutConfig');
			expect(json.columbiaWithoutConfig.id).to.equal('columbia.md');
		});
		it('Returns with schema config collection entry', async () => {
			expect(json).to.haveOwnProperty('oneWithSchemaConfig');
			expect(json.oneWithSchemaConfig.id).to.equal('one.md');
			expect(json.oneWithSchemaConfig.data.publishedAt instanceof Date).to.equal(true);
			expect(json.oneWithSchemaConfig.data.publishedAt.toISOString()).to.equal(
				'2021-01-01T00:00:00.000Z'
			);
		});
		it('Returns with slug config collection entry', async () => {
			expect(json).to.haveOwnProperty('twoWithSlugConfig');
			expect(json.twoWithSlugConfig.slug).to.equal('interesting-two.md');
		});
	});
});
