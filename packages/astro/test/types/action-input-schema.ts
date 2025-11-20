import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { type ActionInputSchema, defineAction } from '../../dist/actions/runtime/server.js';
import { z } from '../../dist/zod.js';

describe('ActionInputSchema', () => {
	const acceptVariants = ['form', 'json', undefined] as const;

	for (const accept of acceptVariants) {
		describe(`accept = ${typeof accept === 'string' ? `'${accept}'` : accept}`, () => {
			it('Infers action input schema', async () => {
				const inputSchema = z.object({
					name: z.string(),
					age: z.number(),
				});

				const _action = defineAction({
					accept,
					input: inputSchema,
					handler: () => undefined,
				});

				expectTypeOf<ActionInputSchema<typeof _action>>().toEqualTypeOf<typeof inputSchema>();
			});

			it('Infers action input value', async () => {
				const schema = z.object({
					name: z.string(),
					age: z.number(),
				});
				const _action = defineAction({
					accept,
					input: schema,
					handler: () => undefined,
				});
				expectTypeOf<z.input<ActionInputSchema<typeof _action>>>().toEqualTypeOf<{
					name: string;
					age: number;
				}>();
			});

			it('Infers action input schema when input is omitted', async () => {
				const _action = defineAction({
					accept,
					handler: () => undefined,
				});
				expectTypeOf<ActionInputSchema<typeof _action>>().toBeNever;
			});
		});
	}
});
