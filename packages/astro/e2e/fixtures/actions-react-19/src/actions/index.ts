import { defineAction, type SafeResult } from 'astro:actions';
import { z } from 'astro/zod';
import { getActionState } from '@astrojs/react/actions';
import { incrementLikes, setLikes } from '../db/store';

export const server = {
	blog: {
		like: defineAction({
			accept: 'form',
			input: z.object({ postId: z.string() }),
			handler: async ({ postId }) => {
				await new Promise((r) => setTimeout(r, 1000));

				return incrementLikes(postId);
			},
		}),
		likeWithActionState: defineAction({
			accept: 'form',
			input: z.object({ postId: z.string() }),
			handler: async ({ postId }, ctx) => {
				await new Promise((r) => setTimeout(r, 200));

				const state = await getActionState<SafeResult<any, number>>(ctx);
				const previousLikes = state.data ?? 0;

				return setLikes(postId, previousLikes + 1);
			},
		}),
	},
};
