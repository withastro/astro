import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const filesSchema = () => {
  return z.object({});
};

const filesCollection = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/files' }),
  schema: filesSchema(),
});

export const collections = { files: filesCollection, };
