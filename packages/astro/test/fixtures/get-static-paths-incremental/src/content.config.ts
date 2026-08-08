// 1. Import utilities from `astro:content`
import { defineCollection } from 'astro:content';

// 2. Import loader(s)
import { file } from 'astro/loaders';

// 3. Import Zod
import { z } from 'astro/zod';

// 4. Define a `loader` and `schema` for each collection
const blogs = defineCollection({
  loader: file('./src/data/blog.json'),
  schema: z.object({
		id: z.string(),
		title: z.string(),
		data:z.array(z.object({
			content: z.string(),
		}))
	}),
});

// 5. Export a single `collections` object to register your collection(s)
export const collections = { blogs };
