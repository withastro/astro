import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as z from 'zod/v4';
import { loadVendor, parseFormData, UnsupportedVendorError } from '../dist/index.js';

describe('parseFormData', () => {
	it('coerces and validates a zod schema', async () => {
		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('age', '25');
		formData.set('newsletter', 'true');
		formData.set('address.city', 'Paris');

		const result = await parseFormData(
			z.object({
				name: z.string(),
				age: z.number(),
				newsletter: z.boolean(),
				address: z.object({ city: z.string() }),
			}),
			formData,
		);

		assert.equal(result.issues, undefined);
		assert.deepEqual(result.value, {
			name: 'Ben',
			age: 25,
			newsletter: true,
			address: { city: 'Paris' },
		});
	});

	it('returns standard schema issues when validation fails', async () => {
		const formData = new FormData();
		formData.set('age', 'not-a-number');

		const result = await parseFormData(z.object({ age: z.number() }), formData);

		assert.ok(result.issues);
		assert.equal(result.issues.length, 1);
		assert.deepEqual(
			result.issues[0].path?.map((segment) =>
				typeof segment === 'object' ? segment.key : segment,
			),
			['age'],
		);
	});

	it('awaits async validation', async () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const result = await parseFormData(
			z.object({ name: z.string().refine(async (value) => value === 'Ben') }),
			formData,
		);

		assert.equal(result.issues, undefined);
		assert.deepEqual(result.value, { name: 'Ben' });
	});

	it('passes FormData through when the schema is not an object', async () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		const result = await parseFormData(z.instanceof(FormData), formData);

		assert.equal(result.issues, undefined);
		assert.equal(result.value, formData);
	});

	it('throws for a validator without an adapter', async () => {
		const schema: StandardSchemaV1<unknown, unknown> = {
			'~standard': {
				version: 1,
				vendor: 'not-a-real-validator',
				validate: (value) => ({ value }),
			},
		};

		await assert.rejects(() => parseFormData(schema, new FormData()), UnsupportedVendorError);
	});

	it('uses a registered vendor', async () => {
		const formData = new FormData();
		formData.set('name', 'Ben');

		loadVendor('custom', (_schema, data) => Object.fromEntries(data.entries()));

		const schema: StandardSchemaV1<unknown, unknown> = {
			'~standard': {
				version: 1,
				vendor: 'custom',
				validate: (value) => ({ value }),
			},
		};

		const result = await parseFormData(schema, formData);

		assert.equal(result.issues, undefined);
		assert.deepEqual(result.value, { name: 'Ben' });
	});
});
