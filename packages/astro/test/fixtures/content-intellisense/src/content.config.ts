import { glob, file } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const blogCC = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
	}),
});

const blogCL = defineCollection({
  // By default the ID is a slug, generated from the path of the file relative to `base`
  loader: glob({ pattern: "**/*", base: "./src/blog-cl" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
  }),
});

const dataCL = defineCollection({
	loader: file('src/data-cl.yml'),
	schema: z.object({ name: z.string(), color: z.string() }),
})

export const collections = {
	"blog-cc": blogCC,
	"blog-cl": blogCL,
	"data-cl": dataCL,
};
