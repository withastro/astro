import { glob, file } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const blogCC = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx,mdoc}", base: "./src/content/blog-cc" }),
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
const dataDates = defineCollection({
	loader: file('src/data-dates.yml'),
	schema: z.object({
		date: z.coerce.date()
	})
})

// Zod features like `.default()` create a difference in the input and output shape of a schema.
// This schema helps us check we use the input shape in generated JSON schemas.
const schemaWithIODifferences = z.object({
	optionalWithDefault: z.string().optional().default('default value'),
	requiredProperty: z.string(),
});
const ioDifferences = defineCollection({
	loader: () => [{ id: '1', requiredProperty: 'defined' }],
	schema: schemaWithIODifferences
});

export const collections = {
	"blog-cc": blogCC,
	"blog-cl": blogCL,
	"data-cl": dataYML,
	"data-cl-json": dataJSON,
	"data-schema-misuse": dataWithSchemaMisuse,
	"data-dates": dataDates,
	"io-differences": ioDifferences,
};
