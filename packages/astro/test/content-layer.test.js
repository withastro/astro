import assert from 'node:assert/strict';
import { sep } from 'node:path';
import { sep as posixSep } from 'node:path/posix';
import { promises as fs } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Content Layer', () => {
	/** @type {import("./test-utils.js").Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({ root: './fixtures/content-layer/' });
	});

	describe('Build', () => {
		let json;
		before(async () => {
			fixture = await loadFixture({ root: './fixtures/content-layer/' });
			await fs
				.unlink(new URL('./node_modules/.astro/data-store.json', fixture.config.root))
				.catch(() => {});
			await fixture.build({});
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
			});
		});

		it('Returns `file()` loader collection', async () => {
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
			assert.ok(json.hasOwnProperty('dataEntry'));
			assert.equal(json.dataEntry.filePath?.split(sep).join(posixSep), 'src/data/dogs.json');
			delete json.dataEntry.filePath;
			assert.deepEqual(json.dataEntry, {
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

		it('returns collection from a simple loader', async () => {
			assert.ok(json.hasOwnProperty('simpleLoader'));
			assert.ok(Array.isArray(json.simpleLoader));

			const item = json.simpleLoader[0];
			assert.deepEqual(item, {
				id: 'siamese',
				collection: 'cats',
				data: {
					breed: 'Siamese',
					id: 'siamese',
					size: 'Medium',
					origin: 'Thailand',
					lifespan: '15 years',
					temperament: ['Active', 'Affectionate', 'Social', 'Playful'],
				},
			});
		});
	});

	describe('Dev', () => {
		let devServer;
		let json;
		before(async () => {
			devServer = await fixture.startDevServer();
			const rawJsonResponse = await fixture.fetch('/collections.json');
			const rawJson = await rawJsonResponse.text();
			json = JSON.parse(rawJson);
		});

		after(async () => {
			devServer?.stop();
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
			});
		});

		it('Returns `file()` loader collection', async () => {
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
			assert.ok(json.hasOwnProperty('dataEntry'));
			assert.equal(json.dataEntry.filePath?.split(sep).join(posixSep), 'src/data/dogs.json');
			delete json.dataEntry.filePath;
			assert.deepEqual(json.dataEntry, {
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

		it('updates collection when data file is changed', async () => {
			const rawJsonResponse = await fixture.fetch('/collections.json');
			const initialJson = await rawJsonResponse.json();
			assert.equal(initialJson.fileLoader[0].data.temperament.includes('Bouncy'), false);

			await fixture.editFile('/src/data/dogs.json', (prev) => {
				const data = JSON.parse(prev);
				data[0].temperament.push('Bouncy');
				return JSON.stringify(data, null, 2);
			});

			// Writes are debounced to 500ms
			await new Promise((r) => setTimeout(r, 700));

			const updatedJsonResponse = await fixture.fetch('/collections.json');
			const updated = await updatedJsonResponse.json();
			assert.ok(updated.fileLoader[0].data.temperament.includes('Bouncy'));
		});
	});
});
