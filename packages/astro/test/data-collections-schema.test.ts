import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { removeDir } from '@astrojs/internal-helpers/fs';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('Content Collections - data collections', () => {
	let fixture: Fixture;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/data-collections-schema/' });
		removeDir(new URL('./fixtures/data-collections-schema/.astro', import.meta.url));
		await fixture.build({});
	});

	describe('Translations Collection', () => {
		it('Generates schema file', async () => {
			const schemaExists = await fixture.pathExists('../.astro/collections/i18n.schema.json');
			assert.equal(schemaExists, true);
		});

		it('Generates schema file when the schema is a function', async () => {
			const schemaExists = await fixture.pathExists('../.astro/collections/func.schema.json');
			assert.equal(schemaExists, true);
		});

		it('Generates valid schema file', async () => {
			const rawJson = await fixture.readFile('../.astro/collections/i18n.schema.json');
			assert.deepEqual(
				JSON.stringify({
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						homepage: {
							type: 'object',
							properties: {
								greeting: {
									type: 'string',
								},
								preamble: {
									type: 'string',
								},
							},
							required: ['greeting', 'preamble'],
						},
						$schema: {
							type: 'string',
						},
					},
					required: ['homepage'],
					title: 'Translations',
					description: 'Translation strings for the site',
				}),
				JSON.stringify(JSON.parse(rawJson)),
			);
		});

		it('Preserves .meta() definitions in the generated JSON schema', async () => {
			const schema = JSON.parse(await fixture.readFile('../.astro/collections/i18n.schema.json'));
			assert.equal(schema.title, 'Translations');
			assert.equal(schema.description, 'Translation strings for the site');
		});

		it('Generates schema file when the schema uses the image function', async () => {
			const schemaExists = await fixture.pathExists('../.astro/collections/image.schema.json');
			assert.equal(schemaExists, true);
		});

		it('Generates valid schema file for an image', async () => {
			const rawJson = await fixture.readFile('../.astro/collections/image.schema.json');
			assert.deepEqual(
				JSON.stringify({
					$schema: 'https://json-schema.org/draft/2020-12/schema',
					type: 'object',
					properties: {
						homepage: {
							type: 'object',
							properties: {
								greeting: {
									type: 'string',
								},
								preamble: {
									type: 'string',
								},
								image: {
									type: 'string',
								},
							},
							required: ['greeting', 'preamble', 'image'],
						},
						$schema: {
							type: 'string',
						},
					},
					required: ['homepage'],
				}),
				JSON.stringify(JSON.parse(rawJson)),
			);
		});
	});
});
