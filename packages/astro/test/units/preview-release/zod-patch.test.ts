import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { errorMap } from '../../../dist/core/errors/zod-error-map.js';
import { patchZodStandardSchema } from '../../../dist/preview-release/zod.js';
import { z } from '../../../dist/zod.js';

describe('patchZodStandardSchema', () => {
	it('formats issues through the error map it was given', async () => {
		const schema = z.object({ title: z.string() });
		patchZodStandardSchema(schema, errorMap);

		const result = await schema['~standard'].validate({});
		assert.equal(result.issues?.[0]?.message, '**title**: Required');
	});

	it('keeps Zod defaults for a schema patched without an error map', async () => {
		const withMap = z.object({ title: z.string() });
		patchZodStandardSchema(withMap, errorMap);

		const withoutMap = z.object({ title: z.string() });
		patchZodStandardSchema(withoutMap);

		const result = await withoutMap['~standard'].validate({});
		assert.equal(result.issues?.[0]?.message, 'Invalid input: expected string, received undefined');
	});
});
