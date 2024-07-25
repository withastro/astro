import { defineAction } from "astro:actions";

export const server = {
    foo: defineAction({
        handler: () => {}
    })
}