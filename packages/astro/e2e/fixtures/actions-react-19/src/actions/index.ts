import { db, Likes, eq, sql } from 'astro:db';
import { defineAction, getApiContext, z } from 'astro:actions';
import { experimental_getActionState } from '@astrojs/react/actions';

export const server = {
	blog: {
		like: defineAction({
			accept: 'form',
			input: z.object({ postId: z.string() }),
			handler: async ({ postId }) => {
				await new Promise((r) => setTimeout(r, 1000));

				const { likes } = await db
					.update(Likes)
					.set({
						likes: sql`likes + 1`,
					})
					.where(eq(Likes.postId, postId))
					.returning()
					.get();

				return likes;
			},
		}),
		likeWithActionState: defineAction({
			accept: 'form',
			input: z.object({ postId: z.string() }),
			handler: async ({ postId }) => {
				await new Promise((r) => setTimeout(r, 200));

				const context = getApiContext();
				const state = await experimental_getActionState<number>(context);

				const { likes } = await db
					.update(Likes)
					.set({
						likes: state + 1,
					})
					.where(eq(Likes.postId, postId))
					.returning()
					.get();

				return likes;
			},
		}),
	},
};
