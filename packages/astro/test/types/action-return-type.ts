import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import {
	type ActionReturnType,
	defineAction,
	type SafeResult,
} from '../../dist/actions/runtime/server.js';
import { z } from '../../dist/zod.js';

describe('ActionReturnType', () => {
	it('Infers action return type', async () => {
		const _action = defineAction({
			input: z.object({
				name: z.string(),
			}),
			handler: async ({ name }) => {
				return { name };
			},
		});
		expectTypeOf<ActionReturnType<typeof _action>>().toEqualTypeOf<
			SafeResult<any, { name: string }>
		>();
		expectTypeOf<ActionReturnType<typeof _action.orThrow>>().toEqualTypeOf<{ name: string }>();
	});

	it('Infers action return type when input is omitted', async () => {
		const _action = defineAction({
			handler: async () => {
				return { name: 'Ben' };
			},
		});
		expectTypeOf<ActionReturnType<typeof _action>>().toEqualTypeOf<
			SafeResult<any, { name: string }>
		>();
		expectTypeOf<ActionReturnType<typeof _action.orThrow>>().toEqualTypeOf<{ name: string }>();
	});
});
