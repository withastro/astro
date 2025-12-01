import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { type ActionReturnType, defineAction } from '../../dist/actions/runtime/server.js';
import type { APIContext } from '../../dist/types/public/context.js';
import { z } from '../../dist/zod.js';

describe('Astro.callAction', () => {
	it('Infers JSON action result on callAction', async () => {
		const context: APIContext = {} as any;
		const action = defineAction({
			input: z.object({
				name: z.string(),
			}),
			handler: async ({ name }) => {
				return { name };
			},
		});
		expectTypeOf(await context.callAction(action, { name: 'Ben' })).toEqualTypeOf<
			ActionReturnType<typeof action>
		>();
	});

	it('Infers form action result on callAction', async () => {
		const context: APIContext = {} as any;
		const action = defineAction({
			accept: 'form',
			input: z.object({
				name: z.string(),
			}),
			handler: async ({ name }) => {
				return { name };
			},
		});
		expectTypeOf(await context.callAction(action, new FormData())).toEqualTypeOf<
			ActionReturnType<typeof action>
		>();
	});

	it('Infers orThrow action result on callAction', async () => {
		const context: APIContext = {} as any;
		const action = defineAction({
			accept: 'form',
			input: z.object({
				name: z.string(),
			}),
			handler: async ({ name }) => {
				return { name };
			},
		});
		expectTypeOf(await context.callAction(action.orThrow, new FormData())).toEqualTypeOf<
			ActionReturnType<(typeof action)['orThrow']>
		>();
	});
});
