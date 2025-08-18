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

const dataSchema = z.object({ name: z.string(), color: z.string() });
const dataYML = defineCollection({ loader: file('src/data-cl.yml'), schema: dataSchema });
const dataJSON = defineCollection({ loader: file('src/data-cl.json'), schema: dataSchema });
const dataWithSchemaMisuse = defineCollection({
	loader: file('src/$schema-misuse.json'),
	schema: z.object({ value: z.number() }),
});

export const collections = {
	"blog-cc": blogCC,
	"blog-cl": blogCL,
	"data-cl": dataYML,
	"data-cl-json": dataJSON,
	"data-schema-misuse": dataWithSchemaMisuse,
};
