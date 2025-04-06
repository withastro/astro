import { z } from "astro/zod";
import { defineAction } from "astro:actions";

export const server = {
    foo: defineAction({
        accept: 'form',
        input: z.object({
            name: z.string(),
            test: z.boolean(),
            nested: z.object({
                num: z.number()
            }),
            // arr: z.array(z.string())
            arr: z.array(z.object({ a: z.number()}))
        }),
        handler: async (input) => {
            console.log(input)
        }
    })
}