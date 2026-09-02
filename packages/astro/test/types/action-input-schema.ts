import { describe, it } from 'node:test';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { expectTypeOf } from 'expect-type';
import { defineAction } from '../../dist/actions/runtime/server.js';
import type { ActionInputSchema } from '../../dist/actions/runtime/types.js';
import { z } from '../../dist/zod.js';

const inputSchema = z.object({
	name: z.string(),
	age: z.number(),
});

// `accept` is a literal at every call site because form and JSON actions no longer
// take the same kind of schema: form actions are Zod-only, JSON actions accept any
// Standard Schema validator.

describe('ActionInputSchema', () => {
	describe(`accept = 'form'`, () => {
		it('Infers action input schema', async () => {
			const _action = defineAction({
				accept: 'form',
				input: inputSchema,
				handler: () => undefined,
			});

			expectTypeOf<ActionInputSchema<typeof _action>>().toEqualTypeOf<typeof inputSchema>();
		});

		it('Infers action input value', async () => {
			const _action = defineAction({
				accept: 'form',
				input: inputSchema,
				handler: () => undefined,
			});
			expectTypeOf<z.input<ActionInputSchema<typeof _action>>>().toEqualTypeOf<{
				name: string;
				age: number;
			}>();
		});

		it('Infers action input schema when input is omitted', async () => {
			const _action = defineAction({
				accept: 'form',
				handler: () => undefined,
			});
			expectTypeOf<ActionInputSchema<typeof _action>>().toBeNever;
		});
	});

	describe(`accept = 'json'`, () => {
		it('Infers action input schema', async () => {
			const _action = defineAction({
				accept: 'json',
				input: inputSchema,
				handler: () => undefined,
			});

			expectTypeOf<ActionInputSchema<typeof _action>>().toEqualTypeOf<typeof inputSchema>();
		});

		it('Infers action input value', async () => {
			const _action = defineAction({
				accept: 'json',
				input: inputSchema,
				handler: () => undefined,
			});
			expectTypeOf<z.input<ActionInputSchema<typeof _action>>>().toEqualTypeOf<{
				name: string;
				age: number;
			}>();
		});

		it('Infers action input schema when input is omitted', async () => {
			const _action = defineAction({
				accept: 'json',
				handler: () => undefined,
			});
			expectTypeOf<ActionInputSchema<typeof _action>>().toBeNever;
		});
	});

	describe('accept = undefined', () => {
		it('Infers action input schema', async () => {
			const _action = defineAction({
				input: inputSchema,
				handler: () => undefined,
			});

			expectTypeOf<ActionInputSchema<typeof _action>>().toEqualTypeOf<typeof inputSchema>();
		});

		it('Infers action input value', async () => {
			const _action = defineAction({
				input: inputSchema,
				handler: () => undefined,
			});
			expectTypeOf<z.input<ActionInputSchema<typeof _action>>>().toEqualTypeOf<{
				name: string;
				age: number;
			}>();
		});

		it('Infers action input schema when input is omitted', async () => {
			const _action = defineAction({
				handler: () => undefined,
			});
			expectTypeOf<ActionInputSchema<typeof _action>>().toBeNever;
		});
	});

	describe('accept is not a literal', () => {
		// Backwards compatibility: a wrapper forwarding an `accept` it received still
		// resolves, as long as the schema is a Zod one.
		const acceptVariants = ['form', 'json', undefined] as const;

		for (const accept of acceptVariants) {
			it(`Infers action input schema for ${accept ?? 'undefined'}`, async () => {
				const _action = defineAction({
					accept,
					input: inputSchema,
					handler: () => undefined,
				});

				expectTypeOf<ActionInputSchema<typeof _action>>().toEqualTypeOf<typeof inputSchema>();
			});
		}
	});

	describe('non-Zod validators', () => {
		// Stands in for any Standard Schema validator that isn't Zod, without pulling
		// another validation library into the test suite.
		const standardSchema: StandardSchemaV1<{ name: string }, { name: string; id: number }> = {
			'~standard': {
				version: 1,
				vendor: 'test',
				validate: (value) => ({ value: value as { name: string; id: number } }),
			},
		};

		it('Infers the input and output of a JSON action', async () => {
			const _action = defineAction({
				input: standardSchema,
				handler: (input) => {
					expectTypeOf(input).toEqualTypeOf<{ name: string; id: number }>();
					return input.id;
				},
			});

			expectTypeOf(_action).parameter(0).toEqualTypeOf<{ name: string }>();
			expectTypeOf<ActionInputSchema<typeof _action>>().toEqualTypeOf<typeof standardSchema>();
		});

		it('Is rejected by a form action', async () => {
			// @ts-expect-error Form actions only accept Zod schemas.
			defineAction({
				accept: 'form',
				input: standardSchema,
				handler: () => undefined,
			});
		});
	});
});
