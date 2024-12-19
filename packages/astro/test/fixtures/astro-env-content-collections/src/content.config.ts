import { defineCollection, z } from "astro:content";
import { FOO } from "astro:env/client"

console.log({ FOO })

export const collections = {
    foo: defineCollection({
        type: "data",
        schema: z.object({
            title: z.string()
        })
    })
}