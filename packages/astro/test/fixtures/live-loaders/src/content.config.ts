import { defineCollection } from "astro:content";
const something = defineCollection({	
	loader: () => ([])
})
export const collections = { something };
