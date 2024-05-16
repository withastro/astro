import { db, Comment, Likes, eq, sql } from 'astro:db';
import { ActionError, defineAction, getApiContext, z } from 'astro:actions';
import { getCollection } from 'astro:content';
import { getActionState } from '@astrojs/react/actions';

export const server = {
	blog: {
		like: defineAction({
			accept: 'form',
			input: z.object({ postId: z.string() }),
			handler: async ({ postId }) => {
				await new Promise((r) => setTimeout(r, 200));

				const context = getApiContext();
				const state = await getActionState<number>(context);

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

		comment: defineAction({
			accept: 'form',
			input: z.object({
				postId: z.string(),
				author: z.string(),
				body: z.string().min(10),
			}),
			handler: async ({ postId, author, body }) => {
				if (!(await getCollection('blog')).find(b => b.id === postId)) {
					throw new ActionError({
						code: 'NOT_FOUND',
						message: 'Post not found',
					});
				}

				const comment = await db
					.insert(Comment)
					.values({
						postId,
						body,
						author,
					})
					.returning()
					.get();
				return comment;
			},
		}),
	},
};
