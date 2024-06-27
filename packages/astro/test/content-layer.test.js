import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Content Collections', () => {
	describe('Query', () => {
		let fixture;
		before(async () => {
			fixture = await loadFixture({ root: './fixtures/content-layer/' });
			await fixture.build();
		});

		describe('Collection', () => {
			let json;
			before(async () => {
				const rawJson = await fixture.readFile('/collections.json');
				json = JSON.parse(rawJson);
			});

			it('Returns custom loader collection', async () => {
				assert.ok(json.hasOwnProperty('customLoader'));
				assert.ok(Array.isArray(json.customLoader));

				const item = json.customLoader[0];
				assert.deepEqual(item, {
					id: '1',
					collection: 'blog',
					data: {
						userId: 1,
						id: 1,
						title: 'sunt aut facere repellat provident occaecati excepturi optio reprehenderit',
						body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto',
					},
					type: 'experimental_data',
				});
			});

			it('Returns file loader collection', async () => {
				assert.ok(json.hasOwnProperty('fileLoader'));
				assert.ok(Array.isArray(json.fileLoader));

				const ids = json.fileLoader.map((item) => item.data.id);
				assert.deepEqual(ids, [
					'labrador-retriever',
					'german-shepherd',
					'golden-retriever',
					'french-bulldog',
					'bulldog',
					'beagle',
					'poodle',
					'rottweiler',
					'german-shorthaired-pointer',
					'yorkshire-terrier',
					'boxer',
					'dachshund',
					'siberian-husky',
					'great-dane',
					'doberman-pinscher',
					'australian-shepherd',
					'miniature-schnauzer',
					'cavalier-king-charles-spaniel',
					'shih-tzu',
					'boston-terrier',
					'bernese-mountain-dog',
					'pomeranian',
					'havanese',
					'english-springer-spaniel',
					'shetland-sheepdog',
				]);
			});

			it('Returns data entry by id', async () => {
				assert.ok(json.hasOwnProperty('dataEntryById'));
				assert.deepEqual(json.dataEntryById, {
					id: 'beagle',
					collection: 'dogs',
					data: {
						breed: 'Beagle',
						id: 'beagle',
						size: 'Small to Medium',
						origin: 'England',
						lifespan: '12-15 years',
						temperament: ['Friendly', 'Curious', 'Merry'],
					},
				});
			});
		});
	});
});
