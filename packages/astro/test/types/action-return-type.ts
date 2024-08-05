import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import {
	type ActionReturnType,
	type SafeResult,
	defineAction,
} from '../../dist/actions/runtime/virtual/server.js';
import { z } from '../../zod.mjs';

describe('ActionReturnType', () => {
	it('Infers action return type', async () => {
		const action = defineAction({
			input: z.object({
				name: z.string(),
			}),
			handler: async ({ name }) => {
				return { name };
			},
		});
		expectTypeOf<ActionReturnType<typeof action>>().toEqualTypeOf<
			SafeResult<any, { name: string }>
		>();
		expectTypeOf<ActionReturnType<typeof action.orThrow>>().toEqualTypeOf<{ name: string }>();
	});
});
