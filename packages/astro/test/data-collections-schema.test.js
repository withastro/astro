import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';

describe('Content Collections - data collections', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({ root: './fixtures/data-collections-schema/' });
		await fixture.build();
	});

	describe('Translations Collection', () => {
		it('Generates schema file', async () => {
			const schemaExists = await fixture.pathExists('../.astro/collections/i18n.schema.json');
			assert.equal(schemaExists, true);
		});

		it('Generates valid schema file', async () => {
			const rawJson = await fixture.readFile('../.astro/collections/i18n.schema.json');
			assert.deepEqual(
				JSON.stringify({
					$ref: '#/definitions/i18n',
					definitions: {
						i18n: {
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
									additionalProperties: false,
								},
								$schema: {
									type: 'string',
								},
							},
							required: ['homepage'],
							additionalProperties: false,
						},
					},
					$schema: 'http://json-schema.org/draft-07/schema#',
				}),
				JSON.stringify(JSON.parse(rawJson))
			);
		});
	});
});
