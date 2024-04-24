import { db, Comment, Likes, eq, sql } from "astro:db";
import { defineAction } from "@astrojs/actions/config";
import { z } from "zod";

export default {
  blog: {
    like: defineAction({
      input: z.object({ postId: z.string() }),
      handler: async ({ postId }, context) => {
        await new Promise((r) => setTimeout(r, 200));

        const { likes } = await db
          .update(Likes)
          .set({
            likes: sql`likes + 1`,
          })
          .where(eq(Likes.postId, postId))
          .returning()
          .get();

        return { likes };
      },
    }),

    comment: defineAction({
			acceptFormData: true,
      input: z.object({
        postId: z.string(),
        author: z.string(),
        body: z.string(),
      }),
      handler: async ({ postId, author, body }) => {
        const comment = await db.insert(Comment).values({
          postId,
          body,
          author,
        }).returning().get();
        return { comment };
      },
    }),
  },
};
