import { defineCollection, z } from "astro:content";

export const collections = {
    posts: defineCollection({
        type: "data",
        schema: z.object({
            title: z.string()
        })
    }),
}