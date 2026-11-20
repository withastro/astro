import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import * as z from 'zod/v4';
import { isInputError } from '../../../dist/actions/runtime/client.js';
import { ACTION_API_CONTEXT_SYMBOL, defineAction } from '../../../dist/actions/runtime/server.js';

/** Minimal context an action handler is bound to when Astro calls it. */
function createContext() {
	return { [ACTION_API_CONTEXT_SYMBOL]: true } as any;
}

/**
 * Stands in for any Standard Schema validator that isn't Zod, without pulling another
 * validation library into the test suite. Trims `name` so that the handler receiving the
 * *output* rather than the input is observable.
 */
const nonZodSchema: StandardSchemaV1<{ name: string }, { name: string }> = {
	'~standard': {
		version: 1,
		vendor: 'test',
		validate: (value: any) => {
			if (typeof value?.name !== 'string') {
				return { issues: [{ message: 'Expected a string', path: ['name'] }] };
			}
			return { value: { name: value.name.trim() } };
		},
	},
};

describe('defineAction with accept: json', () => {
	it('validates with a non-Zod Standard Schema validator', async () => {
		const action = defineAction({
			input: nonZodSchema,
			handler: (input) => input.name,
		});

		const result = await action.call(createContext(), { name: '  Ben  ' });
		assert.equal(result.error, undefined);
		assert.equal(result.data, 'Ben');
	});

	it('surfaces issues from a non-Zod validator as an input error', async () => {
		const action = defineAction({
			input: nonZodSchema,
			handler: (input) => input.name,
		});

		// @ts-expect-error Deliberately invalid input.
		const result = await action.call(createContext(), { name: 42 });
		assert.ok(isInputError(result.error));
		// Normalized to the Zod shape `issues` is still typed as.
		assert.deepEqual(result.error.issues, [
			{ code: 'custom', message: 'Expected a string', path: ['name'] },
		]);
		assert.deepEqual(result.error.fields, { name: ['Expected a string'] });
	});

	it('surfaces issues from a Zod validator as an input error', async () => {
		const action = defineAction({
			input: z.object({ name: z.string() }),
			handler: (input) => input.name,
		});

		// @ts-expect-error Deliberately invalid input.
		const result = await action.call(createContext(), { name: 42 });
		assert.ok(isInputError(result.error));
		// Zod's own issues reach `issues` untouched, extras included.
		assert.equal(result.error.issues[0].code, 'invalid_type');
		assert.deepEqual(result.error.fields, {
			name: ['Invalid input: expected string, received number'],
		});
	});

	it('throws when the input is not a Standard Schema validator', async () => {
		assert.throws(
			() =>
				defineAction({
					// @ts-expect-error Deliberately not a schema.
					input: { name: 'string' },
					handler: (input) => input,
				}),
			/`input` of an action is not a valid schema/,
		);
	});

	it('rejects FormData', async () => {
		const action = defineAction({
			input: nonZodSchema,
			handler: (input) => input.name,
		});

		// @ts-expect-error A JSON action does not accept FormData.
		const result = await action.call(createContext(), new FormData());
		assert.equal(result.error?.code, 'UNSUPPORTED_MEDIA_TYPE');
	});
});

describe('defineAction with accept: form', () => {
	it('coerces FormData with the deprecated Zod input schema', async () => {
		const action = defineAction({
			accept: 'form',
			input: z.object({
				name: z.string(),
				age: z.number(),
				newsletter: z.boolean(),
				address: z.object({ city: z.string() }),
			}),
			handler: (input) => input,
		});

		const formData = new FormData();
		formData.set('name', 'Ben');
		formData.set('age', '25');
		formData.set('newsletter', 'true');
		formData.set('address.city', 'Paris');

		const result = await action.call(createContext(), formData);
		assert.equal(result.error, undefined);
		assert.deepEqual(result.data, {
			name: 'Ben',
			age: 25,
			newsletter: true,
			address: { city: 'Paris' },
		});
	});

	it('surfaces coerced validation issues as an input error', async () => {
		const action = defineAction({
			accept: 'form',
			input: z.object({ age: z.number() }),
			handler: (input) => input,
		});

		const formData = new FormData();
		formData.set('age', 'not-a-number');

		const result = await action.call(createContext(), formData);
		assert.ok(isInputError(result.error));
		assert.ok(result.error.fields.age);
	});

	it('passes FormData straight through when no input schema is set', async () => {
		const action = defineAction({
			accept: 'form',
			handler: (input) => input instanceof FormData,
		});

		const result = await action.call(createContext(), new FormData());
		assert.equal(result.data, true);
	});

	it('throws when the input is not a Standard Schema validator', async () => {
		assert.throws(
			() =>
				defineAction({
					accept: 'form',
					// @ts-expect-error Deliberately not a schema.
					input: { name: 'string' },
					handler: (input) => input,
				}),
			/`input` of an action is not a valid schema/,
		);
	});

	it('throws when the input schema is not a Zod schema', async () => {
		assert.throws(
			() =>
				// @ts-expect-error Form actions only accept Zod schemas.
				defineAction({
					accept: 'form',
					input: nonZodSchema,
					handler: (input) => input,
				}),
			/only supports Zod schemas, but received a `test` schema/,
		);
	});

	it('rejects JSON', async () => {
		const action = defineAction({
			accept: 'form',
			handler: (input) => input,
		});

		// @ts-expect-error A form action only accepts FormData.
		const result = await action.call(createContext(), { name: 'Ben' });
		assert.equal(result.error?.code, 'UNSUPPORTED_MEDIA_TYPE');
	});
});
